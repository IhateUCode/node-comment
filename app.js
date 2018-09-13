const Koa = require('koa')
const router = require('koa-router')()
const mongoose =  require('mongoose')
const bodyparser = require('koa-bodyparser')
const app = new Koa()
const conmentModel = require('./model/comment')
const userModel = require('./model/user')
const serve = require('koa-static')    //静态文件处理
const path = require('path')
const historyApiFallback = require('koa-history-api-fallback')    //处理前端history模式导致的页面刷新空白

app.use(async(ctx,next)=>{
    var startTime = new Date().getTime()   //当前时间
    await next()
    const ms = new Date().getTime() - startTime
    console.log(`method: ${ctx.method} url: ${ctx.url} time:${ms}ms`)
})

mongoose.connect('mongodb://localhost/comment')

mongoose.connection.on('open',function(){
    console.log('连接成功')
})

mongoose.connection.on('err',function(err){
    console.log(err)
})

app.listen(1010)

//获取评论列表
router.get('/comment',async(ctx,next)=>{
    var page = parseInt(ctx.query.page - 1) || ''
    var pageSize = parseInt(ctx.query.pageSize) || ''
    var Doc = await conmentModel.find().skip(page * pageSize).limit(pageSize).sort({'_id':-1}).catch(err=>{ 
        console.log(err) 
    })
    ctx.body = Doc
})

//用户登录
router.post('/user',async(ctx,next)=>{
    var params = {
        username: ctx.request.body.username || '',
        password: ctx.request.body.password || ''
    }
    var userDoc = await userModel.findOne(params).catch(err=>{ 
        console.log(err) 
    })
    if(userDoc){
        var username = userDoc.username
        ctx.cookies.set('username',userDoc.username,{    //给浏览器发送cookies
            path:'/',              // 写cookie所在的路径
            maxAge:10 * 60 * 1000,      // cookie有效时长
            httpOnly: false,  // 是否只用于http请求中获取
            overwrite: false  // 是否允许重写
        })
        ctx.body = {
            status: 1,
            result: userDoc
        }
    }else {
        ctx.body = {
            status: 0,
            result: '账号或密码错误'
        }
    }
})

//用户注册
router.post('/user/register',async(ctx,next)=>{
    var params = {
        username: ctx.request.body.register_name || '',
        password: ctx.request.body.register_pwd || ''
    }
    var doc = new userModel(params)
    var msg = await doc.save().catch(err=>{
        console.log(err)
    })
    if(msg){
        ctx.body = {
            status: 1,
            result: '注册成功'
        }  
    }else {
        ctx.body = {
            status: 0,
            result: '注册失败'
        }  
    }
})

//用户退出登录
router.get('/comment/loginout',async(ctx,next)=>{
    ctx.cookies.set('username','',{    //给浏览器发送cookies
        path:'/',              // 写cookie所在的路径
        maxAge:-1,      // cookie有效时长
        httpOnly: false,  // 是否只用于http请求中获取
        overwrite: false  // 是否允许重写
    })
    ctx.body = {
        status: 0,
        result: '退出成功'        
    }
})

//用户评论
router.post('/comment/add',async(ctx,next)=>{
    var params = {
        name: ctx.request.body.user || '',
        content: ctx.request.body.content || '',
        time: ctx.request.body.time,
        id: ctx.request.body.id,
        replyArr: []
    }
    var doc1 = new conmentModel(params);
    var msg = await doc1.save().catch(err=>{
        console.log(err)
    })
    if(msg){
        ctx.body = {
            status: 1,
            result: '评论成功'
        }  
    }else {
        ctx.body = {
            status: 0,
            result: '评论失败'
        }  
    }
})

//用户回复
router.post('/comment/reply',async(ctx,next)=>{
    var params = {
        name: ctx.request.body.name || '',
        content: ctx.request.body.content || '',
        time: ctx.request.body.time || '',
        replyman: ctx.request.body.replyman || ''
    }
    var id = ctx.request.body.id
    var doc2 = await conmentModel.findOne({id:id}).catch(err=>{
        console.log(err)
    })
    console.log(doc2)
    console.log(doc2.replyArr)
    var doc3 = await doc2.replyArr.push(params)
    var doc4 = doc2.save()
    if(doc4){
        ctx.body = {
            status: 1,
            result: '回复成功'
        }  
    }else {
        ctx.body = {
            status: 0,
            result: '回复失败'
        }  
    }
})

app.use(bodyparser())

app.use(router.routes())

app.use(historyApiFallback());             //这个和下面的静态文件处理 最好放在 api路由中间件的 下面

app.use(serve(path.resolve('dist')))

console.log('this server is running...')


