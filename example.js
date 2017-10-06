const { readPassport } = require('./readPassport')

readPassport('/home/jingli/p2.png', (err, res) => {
    if(err) console.error(err)
    else console.log(res)
})
