const puppeteer = require('puppeteer')
const request = require('request')
require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api')
const telegramToken = process.env.TELEGRAM_TOKEN
const bot = new TelegramBot(telegramToken, {polling: true});
let votos = 1
bot.on('message',( msg) => {
   bot.sendMessage(msg.chat.id, ` Até Agora foram computados ${votos} votos contra o victor Ferraz. #ForaVictorFerraz!` )
})

const config = {
    api_key: process.env.API_KEY
}

async function sleep(seg){
    return new Promise((resolve, reject)=>{
        setTimeout(function(){
            resolve();
        },seg * 1000)
    })
}
 
async function curly(options) {
    return new Promise((resolve, reject)=>{
        try{
            request(options, (err, response, body) => {
                if(err) 
                     return reject(err)
                resolve(body)
            })
        }catch(err){
            reject(err)
        }
    })
}

async function resolveCapcha(site_key, site_url){
    return new Promise(async (resolve, reject) =>{ 
        try{
        let url = `http://2captcha.com/in.php?key=${config.api_key}&json=true&method=userrecaptcha&version=v2&action=verify&min_score=0.3&googlekey=${site_key}&pageurl=${site_url}`
        let response = await curly({
            url: url,
            method: "GET"
        })
            const {status, request: capcha_id} = JSON.parse(response)
            if(status!==1)
                return reject('falha ao obter id do capcha')

            console.log('Resolvendo CAPTCHA...')
            while(1){
                await sleep(15)
                let response2 = await curly({
                    url: `http://2captcha.com/res.php?key=${config.api_key}&action=get&id=${capcha_id}&json=true`,
                    method: "GET"
                })

                const{status, request} = JSON.parse(response2)
                if(status == 1) return resolve(request)

                if(request != 'CAPCHA_NOT_READY'){
                    return reject(request)

                }
            }
        }catch(err){
            reject(err)
        }
    })
}
var count = 0
async function run(){
    try{

            let site_login = process.env.SITE_LOGIN
            let site_url = process.env.SITE_URL
            let site_key = process.env.SITE_KEY


            let browser = await puppeteer.launch({
                headless:true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                  ],
            })
            let page = await browser.newPage()

            await page.goto(site_login, { waitUntil: 'networkidle0' })
            await page.$eval('a[href="/idioma.php?lgn=pt&pg=/login"]', (element) => {
                element.click()
            })
            await page.waitForSelector('input[name=login]')

            const login = process.env.LOGIN
            const password = process.env.PASSWORD

            await page.$eval('input[name="user"]', (element, login) => {
                element.value = login
            }, login)
            await page.$eval('input[name="pass"]', (element, password) => {
                element.value = password
            }, password)

            await page.$eval('input[type=submit]', (element) => {
                element.click()
            })

               await page.goto(site_url, { waitUntil: 'networkidle0' })

            while (1) {
                console.time((votos + 1) + ' Votos contra Victor Ferraz. | #ForaVictorFerraz | ' + 'voto feito em')
                const token = await resolveCapcha(site_key, site_url)
                await page.evaluate((token)=>{
                    document.getElementById('g-recaptcha-response').innerHTML = token
                    document.getElementById('g-recaptcha-response').style.display = ''
                    document.getElementById('actor33').click()
                    document.getElementById('btnVote').click()
                }, token)
                await page.waitForSelector('button[class="swal2-confirm swal2-styled"]')
                await page.click('button[class="swal2-confirm swal2-styled"]')
                console.timeEnd((votos + 1) + ' Votos contra Victor Ferraz. | #ForaVictorFerraz | ' + 'voto feito em')
                votos ++
            }
            await browser.close();
    }catch(err){
      throw (err)
    }

}

(async ()=>{
    try{
        await run()
    }catch(err){
        console.log(err)
    }
})()
