const { readPassport } = require('./readPassport')

readPassport(process.argv[2], (err, res) => {
    if(err) console.error(err)
    else console.log(res)
})

