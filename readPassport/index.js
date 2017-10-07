const { execFile } = require('child_process')
const { exec } = require('child_process')
const pdfImage = require("pdf-image").PDFImage
const countries = require('country-data').countries
const iso3 = Object.keys(countries)
const stringSimilarity = require('string-similarity')

const d2l = {'0': 'O', '1': 'I', '2': 'Z', '3': 'E', '4': 'A', '5': 'S', '6': 'G', '7': 'T', '8': 'B', '9': 'P'}
const l2d = { 'A': '4', 'B': '', 'C': '', 'D': '0', 'E': '', 'F': '', 'G': '6', 'H': '', 'I': '1', 'J': '', 'K': '', 'L': '', 'M': '', 'N': '', 'O': '0', 'P': '', 'Q': '', 'R': '', 'S': '5', 'T': '7', 'U': '0', 'V': '', 'W': '', 'X': '', 'Y': '', 'Z': '2'}
const male = 'MNHW'
const female = 'FITPR'

function countryConfirm(countryCode)
{
  countryCode.forEach((code, i) => {
    let parseCode = ''
    code.split('').forEach(c => {
    if (c >= 'A' && c <= 'Z')
      parseCode += c
    })
    if (iso3.findIndex(iso => iso === parseCode))
    return parseCode;
    countryCode[i] = parseCode
  })

  let sim = -0.1, code = ''
  countryCode.forEach(parseCode => {
    iso3.forEach(iso => {
      if (iso.length === 3 && stringSimilarity.compareTwoStrings(parseCode, iso) > sim) {
        sim = stringSimilarity.compareTwoStrings(parseCode, iso)
        code = iso
      }
    })
  })
  return code
}

function nameConfirm(name)
{
  let parseName = ''
  name = name.replace(/  +/g, ' ').trim();
  name.split('').forEach(c => {
    if ((c >= 'A' && c <= 'Z') || c === ' ')
      parseName += c
  })
  return parseName
}

function dateConvert(date, type)
{
  let parseDate = ''
  if(date.length === 6) {
    date.split('').forEach(c => {
      if (c >= '0' && c <= '9')
        parseDate += c
      else parseDate += l2d[c]
    })
  } else {
    date.split('').forEach(c => {
      if (c >= '0' && c <= '9')
        parseDate += c
    })
  }

  if (type == 0) {
    if (parseDate[0] === '0' || parseDate[0] === '1')
      return '20' + parseDate
    else return '19' + parseDate
  }
  else {
    return "20" + parseDate
  }
}

function passportParse(passport)
{
  if (passport.length && (passport[0] >= '0' && passport[0] <= '9'))
  {
    //console.log(d2l[passport[0]])
    passport = d2l[passport[0]] + passport.substr(1)
    //console.log(passport[0])
  }
  let parsePass = ''
  passport.split('').forEach(p => {
    if ((p >= '0' && p <= '9') || (p >= 'A' && p <= 'Z'))
      parsePass += p
  })
  return parsePass
}

function passporttypeConfirm(type)
{
  let parseType = ''
  type.split('').forEach(t => {
    if (t >= 'A' && t <= 'Z')
      parseType += t
  })
  if (parseType.length > 0 && parseType[0] === 'P')
    return parseType
  else return ''

}

function sexConfirm(sex)
{
  if (sex.length === 1 && (sex === 'M' || sex === 'F'))
    return sex
  else if (sex.length >= 1) {
    if (male.indexOf(sex[0]))
      return 'M'
    else (female.indexOf(sex[0]))
      return 'F'
  }
  return sex
}

function readPassportfromPNG(passport, cbk)
{
  execFile(process.env.HOME + '/.local/bin/mrz', [passport], (error, stdout, stderr) => {
    if (error) {
      cbk(error)
    }
    else {
      let result = stdout.split('\n')
      let resMap = {}
      result.forEach(r => {
        const ele = r.split('\t')
        if (ele[0].length)
          resMap[ele[0]] = ele[1]
      })
      if (parseFloat(resMap['valid_score']) <= 1)
      {
        tesseractRead(passport, (err, data) => {
          if (err) return cbk(new Error('unable recognize'))
          else cbk(null, data)
        })
      } else {
        let initialRes = {}
        initialRes['nationality'] = countryConfirm([resMap['country'], resMap['nationality']])
        initialRes['surname'] = nameConfirm(resMap['surname']);
        initialRes['names'] = nameConfirm(resMap['names']);
        initialRes['passport_number'] = passportParse(resMap['number'])
        initialRes['passport_type'] = passporttypeConfirm(resMap['type'])
        initialRes['date_of_birth'] = dateConvert(resMap['date_of_birth'], 0)
        initialRes['expiration_date'] = dateConvert(resMap['expiration_date'], 1)
        initialRes['sex'] = sexConfirm(resMap['sex'])
        cbk(null, initialRes)
      }
    }
  })
}

function readPassport(passport, cbk)
{
  if (passport.endsWith(".pdf") || passport.endsWith(".PDF"))
  {
    let cmd = "convert -density 150 " + passport + " -quality 90 tmp.png"
    exec(cmd, (error, stdout, stderr) => {
      if (error) cbk(error)
      else {
        passport = 'tmp.png'
        readPassportfromPNG(passport, (err, res) => {
          if(err) cbk(err)
          else cbk(null, res)
        })
      }
    })
  }
  else if (passport.endsWith(".jpg") || passport.endsWith(".JPG") || passport.endsWith(".png") || passport.endsWith(".PNG"))
  {
    readPassportfromPNG(passport, (err, res) => {
      if(err) cbk(err)
      else cbk(null, res)
    })
  }
  else {
    cbk(new Error("file type error"))
  }
}

function checkDate(dates)
{
  const mul = [7, 3, 1]
  let res = ''
  for (var j = 0; j < dates.length; j++)
  {
    date = dates[j]
    let sum = 0
    for (var i = 0; i < date.length; i++)
    {
      let v = 0
      if(date[i] === '<') v = 0;
      else if (date[i] >= 'A' && date[i] <= 'Z')
        v = date[i] - 'A'+ 10
      else v = date[i] - '0'
      sum += v * mul[i%3]
    }
    if (sum % 10 === dates[6]) {
      res = date.substr(0, 6)
      break
    }
  }
  if (res === '')
    res = dates[0]
  return res
}

function tesseractRead(passport, cbk)
{
  const { exec } = require('child_process')
  //-c tessedit_char_whitelist=1234567890QWERTYUIOPLKJHGFDSAZXVBNM\\<"
  exec('tesseract ' + passport + " stdout", (error, stdout, stderr) => {
    if (error) cbk(error)
    else {
      let r = stdout.split('\n')
      let cand = []
      for (var i = r.length - 1; i >= 0; i--) {
          let tmp = r[i].replace(/ /g,'')
          if (tmp.indexOf('<') !== -1 && tmp.length > 40) {
             cand.push(tmp)
             if (cand.length >= 2)
               break
          }
      }
      if (cand.length < 2) cbk(new Error("unable recognize"))
      let initialRes = {}
      initialRes['nationality'] = countryConfirm([cand[1].substr(2, 3)])
      initialRes['passport_type'] = passporttypeConfirm(cand[1].substr(0, 2))
      let surname = '', names = ''
      let n = ''
      for (var i = 5; i < cand[1].length; i++) {
          if (cand[1][i] !== '<')
              n += cand[1][i]
          else if (cand[1][i] === '<' && i + 1 < cand[1].length && cand[1][i+1] === '<')
          {
            if (surname.length === 0)
              surname = n
            else {
              names = n
              break
            }
            n = ''
          } else {
              n += ' '
          }
      }
      initialRes['surname'] = nameConfirm(surname);
      initialRes['names'] = nameConfirm(names);
      initialRes['passport_number'] = passportParse(cand[0].substr(0, 9))
      let birth = [cand[0].substr(13, 7), cand[0].substr(12, 7), cand[0].substr(14, 7)]
      let expire = [cand[0].substr(21, 7), cand[0].substr(20, 7), cand[0].substr(22, 7)]
      initialRes['date_of_birth'] = dateConvert(checkDate(birth),  0)
      initialRes['expiration_date'] = dateConvert(checkDate(expire), 1)
      let sex = ''
      if (cand[1][20] === 'M' || cand[1][20] == 'F')
         sex = cand[1][20]
      else {
          if (cand[1][19] === 'M' || cand[1][19] == 'F')
              sex = cand[1][19]
          if (cand[1][21] === 'M' || cand[1][21] == 'F')
              sex = cand[1][21]
          if (sex.length === 0)
              sex = cand[1][20]
      }
      initialRes['sex'] = sexConfirm(sex)

      cbk(null, initialRes)
    }
  })
}

//exports.readPassport = tesseractRead
exports.readPassport = readPassport

