const extractObject = require('./extract-object')
const utils = require('./utils')
const InvalidInputError = require('./invalid-input-error')
const aggregatorConfigParser = require('../lib/aggregator-config-parser')
const pipeParser = require('../lib/parse-input-pipes')
const parseInputGroups = require('../lib/parse-input-group').parseInputGroups

/**
 * Throws an InvalidInputError if plugins[id] is not available.
 *
 * @param plugins - object with one property per plugin, whose keys are the
 *                  plugin names and whose values are the plugin's
 *                  configuration
 * @param id - the plugin name that must exist
 */
function ensurePluginExists (plugins, id) {
  if (!plugins.hasOwnProperty(id)) {
    throw new InvalidInputError(`Plugin not configured: ${id}`)
  }
}

/**
 * Throws an InvalidInputError if aggregator is not a valid score aggregator.
 *
 * @param aggregator - aggregator name to by dynamically loaded or an
 *                     aggregator object with a combine method
 */
function ensureValidAggregator (aggregator) {
  if (!aggregator) {
    throw new InvalidInputError(`Aggregator is missing`)
  }
}

/**
 * Throws an InvalidInputError if plugins is not a valid set of plugins.
 *
 * @param plugins - object whose keys are plugin names and values are plugin
 *                  configurations with the properties 'use' and 'inputs'
 */
function ensureValidPlugins (plugins) {
  Object.keys(plugins).forEach((key) => {
    let plugin = plugins[key]
    if (!plugin.use) {
      throw new InvalidInputError(`Plugin's scoring function is missing: ${key}.use`)
    }
    if (!Array.isArray(plugin.inputs)) {
      throw new InvalidInputError(`Plugin's inputs field is not an array: ${key}.inputs`)
    }
  })
}

/**
 * Checks if there is an idPath for the mapped objects in the configuration and
 * ensures the right format ( 'somestring[].id' ). It is not obligatory to
 * insert an idPath to the configuration.
 *
 * @param idPath - config.idPath from the configuration json (string | undefined)
 */
function ensureValidIdPathConfig (idPath) {
  if (idPath === undefined) {
    // Ignore ids but config is correct
  } else if (idPath === null || !(typeof idPath === 'string')) {
    throw new InvalidInputError('The defined idPath is null and should be string or undefined')
  } else if (!idPath.includes('[].')) {
    throw new InvalidInputError('The defined idPath is not an array (i.e. a.b[].id)')
  } else {
    var parts = idPath.split('[]')
    if (parts.length !== 2) {
      throw new InvalidInputError('The maximum allowed array depth of idPath is 1')
    } else if (parts[0] === '') {
      throw new InvalidInputError('The idPath array is not correctly formed ([].a not allowed)')
    }
  }
}

 /**
 *Throws an InvalidInputError if the configuration of the inputGroups is invalid.
 *
 * @param plugins - object whose keys are plugin names and values are plugin
 *                  configurations with the properties 'use' and 'inputs'
 *                  if 'inputs' is not given check whether there is an 'inputGroup' and validates it
 */
function ensureValidInputGroups (plugins) {
  if (!plugins) {
    throw new InvalidInputError(`Plugin configuration is missing`)
  }
  Object.keys(plugins).forEach((key) => {
    let plugin = plugins[key]
    if (!plugin.inputs && !plugin.inputGroup) {
      throw new InvalidInputError(`Plugin's inputGroup paths are missing: ${key}`)
    }
    if (!plugin.inputs && plugin.inputGroup) {
      if (!Array.isArray(plugin.inputGroup)) {
        throw new InvalidInputError(`Plugin's inputGroup field is not an array: ${key}`)
      }
      // Iterate over the inputGroup and check the content
      for (let arr of plugin.inputGroup) {
        if (!Array.isArray(arr)) {
          throw new InvalidInputError(`Value of plugin's inputGroup field is not an array: ${key}`)
        }
      }
    }
  })
}

/**
 * Throws an InvalidInputError if the configuration object passed is invalid.
 * See ScoreManager.constructor for details.
 *
 * @param config - the score manager configuration to be validated
 */
function ensureValidConfiguration (config) {
  if (!config) {
    throw new InvalidInputError(`ScoreManager configuration is missing`)
  }
  ensureValidIdPathConfig(config.idPath)
  ensureValidAggregator(config.aggregator)
  ensureValidInputGroups(config.plugins)
  config = parseInputGroups(config)
  ensureValidPlugins(config.plugins)
}

/**
 * Take an array of elements which are either scalar values or arrays and
 * return a square array of arrays where all sub arrays have the same
 * dimension broadcasting scalar values. For example:
 *   [1, [2, 3], [4, 5]] -> [[1, 1], [2, 3], [4, 5]].
 *
 * @param inputValues - an array of elements that are scalar or arrays
 */
function expandValues (inputValues, isArrayPath) {
  let arrays = inputValues.filter((value, idx) => isArrayPath[idx])
  let length = arrays.reduce((minLength, element) => {
    return Math.min(minLength, element.length)
  }, Number.POSITIVE_INFINITY)

  if (!Number.isFinite(length)) {
    length = 1
  }

  let result = []
  for (let i = 0; i < length; i++) {
    result[i] = inputValues.map((element, idx) => isArrayPath[idx] ? element[i] : element)
  }
  return result
}

/**
 * Take an object where each property (key) has an array value of equal length
 * and return an array of that length where each element is an object with the
 * properties of the originial keysOfArrays but only a scalar value. Example:
 *
 *   { a: [1, 2, 3], b: [4, 5, 6] }                 will be transformed to
 *   [ {a: 1, b: 4}, {a: 2, b: 5}, {a: 3, b: 6} ]
 *
 * @param keysOfArrays - an object where each property has an array value
 */
function insideOut (keysOfArrays) {
  let len = Object.values(keysOfArrays)[0].length
  let arrayOfKeys = []
  for (let i = 0; i < len; i++) {
    let keys = {}
    Object.keys(keysOfArrays).forEach(k => {
      keys[k] = keysOfArrays[k][i]
    })

    arrayOfKeys[i] = keys
  }

  return arrayOfKeys
}

/**
 * Return the scoring function from the plugin configuration. If plugin.use is
 * set, then dynamically load the plugin from the /lib/plugins/ folder and
 * return it. Otherwise return the function in plugin.score.
 *
 * @param plugin - a single plugin's configuration
 */
function getScoringFunction (plugin) {
  try {
    return typeof plugin.use === 'string'
    ? utils.loadPlugin(plugin.use) : plugin.use
  } catch (err) {
    throw new InvalidInputError(`Plugin '${plugin.use}' does not exist.`)
  }
}

/**
 * Return the subobject from blob specified by inputPath where inputPath may
 * contain pipes to preprocess the subobject, for example:
 *   let blob      = { x: { y: 'z' } }
 *   let inputPath = 'x.y | to-upper-case'
 *
 *   extractInputs(blob, inputPath) -> ['Z', null]
 * If there are errors extracting the subobject due to an invalid path or
 * non-matching data the second return value will be set (see extractObject).
 * The return value will be [subobject, error].
 *
 * @param blob - the data from which a subobject will be extracted
 * @param inputPath - the path of the subobject to be extracted
 */
function extractInputs (blob, inputPath) {
  // Get pipes
  let pipes = pipeParser.getPipes(inputPath)
  // Remove pipes from input
  inputPath = pipeParser.removePipes(inputPath)
  let [value, errorlist] = extractObject(blob, inputPath)
  if (errorlist) {
    return [value, errorlist]
  }

  // Apply pipes
  for (let pipe of pipes) {
    value = pipeParser.applyPipe(pipe, value)
  }
  return [value, errorlist]
}

/**
 * There are three important concepts that facilitate assigning a score to
 * tasks representing the degree to which they match an uploaded file and it's
 * metadata: the ScoreManager, one or more Plugins and an Aggregator.
 *
 * A Plugin is a function that takes two argument - a file object that
 * contains meta data, for example the filename, size, time of upload and/or
 * the file contents, and a task object that contains meta data related to the
 * task, for example the task name. It returns a floating point numeric score
 * in the range 0.0 to 1.0 which describes the degree in which the file and
 * the task are correlated in the aspect that this particular Plugin is focused
 * on. For example, the `similar-text` Plugin will return 1.0 if the title of the
 * file is the same as the title of the task and 0.0 otherwise.
 *
 * An Aggregator is a policy that combines a set of scores that were previously
 * assigned to a task by multiple Plugins into a single final score value. For
 * more details see score-aggregator.js.
 *
 * The purpose of the ScoreManager is to provide the entry point for a scoring
 * request, delegate the data to multiple Plugins, and combine their individual
 * scores using an Aggregator.
 */
class ScoreManager {
  /**
   * Constructs a ScoreManager using the configuration given by config.
   *
   * Plugins are configured in the config.plugins property, which is an object
   * with properties whose keys are the plugin identifiers. The configuration
   * has the form:
   *   config.plugins = {
   *     'plugin-a': {
   *       use: pluginScoringFunction,
   *       inputs = ['path.to.first.input', 'path.to.second.input.array[].x']
   *     },
   *     'plugin-b': ...
   *   }
   * Each plugin's score field is a plugin function with two arguments. The
   * plugin will receive a subobject and a subobject array of the global input
   * data by means of the path, for example assume that
   *   blob = { a: { b: 'foo' }, c: [ { d: 'bar' }, { d: 'baz' } ] }
   * then the paths ['a.b', 'c[].d'] will refer to the values 'foo' and
   * ['bar', 'baz']. Thus, the plugin configured with this path will be called
   * with score('foo', 'bar') and score('foo', 'baz').
   *
   * The Aggregator is given as the config.aggregator property and must be an
   * object that has a combine(scoresObj) method, which will be called with a
   * scoresObj of the form
   *   scoresObj = {'plugin-a': score-of-a, 'plugin-b': score-of-b, ...}
   *
   * @param config - an object that provides the configuration for Plugins and
   *                 the Aggregator
   */
  constructor (config) {
    ensureValidConfiguration(config)

    this.idPath = config.idPath
    this.plugins = config.plugins
    this.aggregatorConfig = config.aggregator
  }

  /**
   * Return the individual and aggregated Plugin scores for the given input
   * object. This will score in a one-to-many relationship and will return an
   * array of the form
   *   result = [
   *     {'plugin-a': score-a, 'plugin-b': score-b, 'total': aggregated-score},
   *     ...
   *   ]
   * The number of elements in the result array is defined by the number of
   * elements of the array in the input path (see ScoreManager.constructor()).
   *
   * @param blob - an object with metadata that will be processed by configured
   *               plugins
   */
  score (blob) {
    let scores = {}
    let ids = null

    // Find or generate ids if idPath is set
    if (this.idPath !== undefined) { ids = this.findAndEnsureIds(blob) }

    Object.keys(this.plugins).forEach(key => {
      scores[key] = this.scoreWith(key, blob)
    })

    scores = insideOut(scores)
    return scores.map((score, i) => {
      // Build score results
      let result = utils.cloneObject(score)
      let total = this.aggregate(score)

      // Append id to result
      if (this.idPath !== undefined) { result.id = ids[i] }

      result.total = total

      return result
    })
  }

  /**
   * Finds the ids in the mapping objects using this.idPath. Generates new
   * id (if it does not exist). Generates an array of id (in the order of
   * the mapping objects) to append the id later to the scores.
   *
   * @param blob input data to scoreManager
   * @return array of ids
   */
  findAndEnsureIds (blob) {
    // Append ids to array of mapped objects (i.e. tasks[])
    let objectsPath = this.idPath.split('[].')
    let objects = extractInputs(blob, objectsPath[0])[0]

    var ids = extractInputs(blob, this.idPath)[0].map((id, idx) => {
      if (id === undefined) {
        // use Date.now() + idx as generated id
        let id = Date.now() + idx
        utils.insertByPath(objects[idx], objectsPath[1], id)
        return id
      } else {
        return id
      }
    })

    return ids
  }

  /**
   * Score the input data blob using the single plugin defined by pluginId.
   * This method will return an array of scores, one for each element in the
   * configured input array, for example:
   *   plugins = { 'foo': { use: fooFunction, inputs: ['a', 'b[]'] } }  and
   *   blob = { a: 'Hello', b: ['World', 'Goodbye'] }
   * will return
   *   [ fooFunction('Hello', 'World'), fooFunction('Hello', 'Goodbye') ].
   */
  scoreWith (pluginId, blob) {
    ensurePluginExists(this.plugins, pluginId)

    let plugin = this.plugins[pluginId]

    // Extract input values from blob by parsing path plugin.inputs.
    let inputValues = plugin.inputs.map(inputPath => extractInputs(blob, inputPath))
    let scoringFnc = getScoringFunction(plugin)

    let isArrayPath = plugin.inputs.map(path => path.match(/\[]/g) !== null)
    let args = expandValues(inputValues.map(element => element[0]), isArrayPath)
    let errors = inputValues.map(element => element[1])

    let scores = args.map((arglist, argidx) => {
      const err = errors[argidx]
      if (err) {
        return 'failure: ' + err.message
      }
      try {
        return scoringFnc.apply(null, arglist.concat([plugin.params]))
      } catch (err) {
        return 'failure: ' + err.message
      }
    })
    return scores
  }

  /**
   * Calculate and return the total score given a map of plugin-ids -> scores.
   * Ignore any scores that are non-numeric or outside the valid range.
   *
   * @param scores - an object where each key is a plugin id and it's value is
   *                 score given by that plugin
   */
  aggregate (scores) {
    let successfulKeys = Object.keys(scores).filter(
      key => utils.isInRange(scores[key], 0.0, 1.0)
    )

    if (successfulKeys.length === 0) {
      return 'failed: no successful plugins'
    }

    let successfulScores = {}
    successfulKeys.forEach(key => { successfulScores[key] = scores[key] })

    let aggregatorParseTree = aggregatorConfigParser.parse(this.aggregatorConfig)
    return aggregatorParseTree.eval(successfulScores)
  }
}

/**
 * Return a new ScoreManager. This is a factory function whose main purpose is
 * the ease of testing modules depending on ScoreManager.
 */
function create (config) {
  return new ScoreManager(config)
}

module.exports = { create }
