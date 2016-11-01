'use strict'

let server = require('./server')
let port = process.env.PORT || 8080

server.listen(port, () => {
  console.log('server running on port %d', port)
})

