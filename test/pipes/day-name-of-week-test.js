const buster = require('buster')
const pipe = require('../../lib/pipes/day-name-of-week')

buster.testCase('Pipe: dayNameOfWeek', {
  'should return day name of week': function () {
    var testTime = new Date('January 05, 2017 9:00:00 UTC')
    let input = testTime.getTime() / 1000
    let result = pipe(input)
    buster.assert.equals('Thursday', result)
  }
})
