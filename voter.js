const db = require('knex')({
    client: 'pg',
    connection: {
        host: '149.28.102.99',
        user: 'c218fcb27e54eb15db7af44c2e06755d',
        password: 'Ip42SfbJ$Z]cA,vL3@',
        database: '5832ca5e1113e22399748c2549ab3b6c'
    },
});

const puppeteer = require('puppeteer')
const http = require('http')
const request = require('request')
const { getHeapCodeStatistics } = require('v8')
const server = http.createServer()
server.listen(process.env.PORT)

require('dotenv').config()



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

            // await page.goto(site_login, { waitUntil: 'networkidle0' })
            // await page.$eval('a[href="/idioma.php?lgn=pt&pg=/login"]', (element) => {
            //     element.click()
            // })
            // await page.waitForSelector('input[name=login]')

            // const login = process.env.LOGIN
            // const password = process.env.PASSWORD

            // await page.$eval('input[name="user"]', (element, login) => {
            //     element.value = login
            // }, login)
            // await page.$eval('input[name="pass"]', (element, password) => {
            //     element.value = password
            // }, password)

            // await page.$eval('input[type=submit]', (element) => {
            //     element.click()
            // })
            
            let page = await browser.newPage()
            await page.goto(site_url, { waitUntil: 'networkidle0' })
            await page.waitForSelector('a[class="btn btn-danger btn-small"]')

            while (1) {
                const  start = Date.now()
                const token = await resolveCapcha(site_key, site_url)
                await page.evaluate((token)=>{
                    document.getElementById('g-recaptcha-response').innerHTML = token
                    document.getElementById('g-recaptcha-response').style.display = ''
                    document.getElementById('actor72').click()
                    document.getElementById('btnVote').click()
                }, token)
                await page.waitForSelector('button[class="swal2-cancel swal2-styled"]')
                const data = await page.$eval('#swal2-content', element => { 
                    return element.innerHTML
                })

                if(data.indexOf('sucesso') >= 0){
                    const end = Date.now()
                    await db('votes').insert({name: 'Atlas Mosão', tempo: end-start})
                    console.log('Voto concluido em  ' + ((end - start)*1000).toFixed(2) + 's')
                }else{
                    throw new Error('Vote Error')
                }
                await page.click('button[class="swal2-cancel swal2-styled"]')
                
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

