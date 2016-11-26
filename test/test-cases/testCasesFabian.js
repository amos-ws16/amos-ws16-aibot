
let task1 = {
  name: 'book a flight',
  timestamp: 1479934104,
  duedate: 1479935104,
  user: 'robert',
  assignees: ['thomas', 'nadine'],
  description: 'Book a flight for the next meeting in Cairns.'
}

let task2 = {
  name: 'find a pot full of gold',
  timestamp: 1479935104,
  duedate: 1479936172,
  user: 'maria',
  assignees: ['nicole', 'nikolaus', 'rainer']
}

let task3 = {
  name: 'find the end of the rainbow',
  timestamp: 1479936104,
  duedate: 1479937104,
  user: 'paul',
  assignees: ['peter', 'christian'],
  description: 'there is a pot of gold!',
  location: 'in the woods'
}

let task4 = {
  name: 'grow a mustage',
  timestamp: 1479937104,
  duedate: 1482438999,
  user: 'cleo',
  assignees: ['ronald', 'donald'],
  location: 'in your face'
}

let task5 = {
  name: 'learn swimming',
  timestamp: 1479938104,
  duedate: 1479944104,
  user: 'andreas',
  description: 'try not to sink like a stone'
}

let task6 = {
  name: 'brick a phone',
  timestamp: 1479939104,
  duedate: 1479946633,
  user: 'luise',
  location: 'at home'
}

let task7 = {
  name: 'recover deleted photos',
  timestamp: 1479940104,
  duedate: 1479944204,
  user: 'walter',
  assignees: ['stephanie', 'kathrin']
}

let task8 = {
  name: 'quit phone contract',
  timestamp: 1479941104,
  duedate: 1479942123,
  user: 'jana',
  assignees: ['tim', 'johann']
}

let testCase1 = {
  tasks: [task1, task2, task3, task4, task5, task6, task7, task8],
  file: {
    name: 'book fligth',
    filetype: 'jpeg',
    timestamp: 1479934200,
    user: 'olga'
  }
}

let testCase2 = {
  tasks: [task2, task1, task3, task5],
  file: {
    name: 'find pot',
    filetype: 'gold',
    timestamp: 1479934634,
    user: 'timmi',
    description: 'A pot of gold is often found near a rainbow.'
  }
}

let testCase3 = {
  tasks: [task4, task2, task3, task1, task5, task6],
  file: {
    name: 'facelift',
    filetype: 'png',
    timestamp: 1479937012,
    user: 'robert',
    description: 'Some say its a beard, but it is a mustage!'
  }
}

let testCase4 = {
  tasks: [task5, task2, task3, task4, task1, task6, task7],
  file: {
    name: 'swimmers',
    filetype: 'jped',
    timestamp: 1479938210,
    user: 'swimming pool',
    description: 'speedos are my favourite swimmers'
  }
}

let testCase5 = {
  tasks: [task2, task1, task3],
  file: {
    name: 'goldie',
    filetype: 'png',
    timestamp: 1479934165,
    user: 'marvin',
    description: 'If you need some gold, try beating up the leprechaun at the rainbow'
  }
}

let testCase6 = {
  tasks: [task7, task2, task3, task4, task5, task6, task1],
  file: {
    name: 'recovery suite',
    filetype: 'exe',
    timestamp: 1479941254,
    user: 'pete'
  }
}

let testCase7 = {
  tasks: [task1, task2, task3, task4, task5, task6, task7],
  file: {
    name: 'no matches',
    filetype: 'tiff',
    timestamp: 1372773845,
    user: 'bill',
    description: 'no match you will find here'
  }
}

let testCase8 = {
  tasks: [task6, task7, task8],
  file: {
    name: 'break phone',
    filetype: 'pdf',
    timestamp: 1479939442,
    user: 'timo'
  }
}

let testCase9 = {
  tasks: [task8, task2, task3, task4, task5, task6],
  file: {
    name: 'phone company',
    filetype: 'txt',
    timestamp: 1479941258,
    user: 'gert'
  }
}

let testCase10 = {
  tasks: [task7, task2, task3, task4, task5, task6, task1, task8],
  file: {
    name: '',
    filetype: '',
    timestamp: 1479940110,
    user: 'claire',
    description: 'hope this helps'
  }
}

module.exports = {
  testCase1,
  testCase2,
  testCase3,
  testCase4,
  testCase5,
  testCase6,
  testCase7,
  testCase8,
  testCase9,
  testCase10
}
