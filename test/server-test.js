const buster = require('buster')
const request = require('supertest')
const app = require('../lib/server.js')

const ScoreManager = require('../lib/score-manager')
const ScoreCombiner = require('../lib/score-combiner')
const sameTitlePlugin = require('../lib/plugins/same-title-plugin')

buster.testCase('GET /api/welcome', {
  'should return a welcome message': (done) => {
    request(app)
      .get('/api/welcome')
      .expect(200)
      .end(done((err, res) => {
        buster.refute(err)
        buster.assert.match(res.text, /Welcome/)
      }))
  }
})

buster.testCase('GET /api/auth', {
  'should return an auth token': (done) => {
    request(app)
      .get('/api/auth')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(done((err, res) => {
        buster.refute(err)

        const message = res.body
        buster.assert(message.success)
        // Any string is fine for now.
        buster.assert.isString(message.token)
      }))
  }
})

buster.testCase('POST /api/score', {
  'should pass data to score manager': (done) => {
    let manager = new ScoreManager(new ScoreCombiner.Mean())
    manager.registerPlugin('same-title', sameTitlePlugin)
    app.setScoreManager(manager)

    let blob = {
      file: { title: 'location.png' },
      tasks: [
        { title: 'location' },
        { title: 'something_else' }
      ]
    }

    request(app)
      .post('/api/score')
      .send(blob)
      .expect('Content-Type', /json/)
      .expect(200)
      .end(done((err, res) => {
        buster.refute(err)

        let expected = [
          { score: 1.0, scores: { 'same-title': 1.0 } },
          { score: 0.0, scores: { 'same-title': 0.0 } }
        ]

        buster.assert.match(res.body, expected)
      }))
  }
})

