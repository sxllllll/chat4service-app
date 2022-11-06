import {  SEND_CODE } from "./handlers"
const SOCKET_URL = "wss://wss.chat4service.com/client"
// const SOCKET_URL = "ws://192.168.5.199:8089/client"
// 发送异常数据队列
const task = []

/**
 * @var startFn Function 登录方法
 * @var sid  string  用户Sid
 */
export default (  startFn, sid ) => {
	
	let isConnected = false;
	let pingTimer = null;
	
	// 连接
	const reconnect = () => {
		console.log("connect started" )
		uni.connectSocket({
			url: SOCKET_URL,
		})
	}
	// 消息发送
	const emit = (cmd , data)=> {
		// 发送时 清除一下之前的定时器
		heartPing()
		if ( !isConnected ) {
			task.push( { cmd: cmd , data:data } )
			reconnect() 
			return ;
		}
		uni.sendSocketMessage({
			data: JSON.stringify({
				cmd: Number(cmd) ,
				data : JSON.stringify(data)
			}) ,
			success(res) {
				console.log("send success :" , JSON.stringify(res))
			},
			fail(err) {
				console.log("send failed : " ,err)
				task.push( { cmd: cmd , data:data } )
			}
		})
	}
	
	// 心跳检测
	const heartPing = ()=> {
		clearInterval( pingTimer )
		pingTimer = setInterval(()=> {
			if ( task.length > 0 ) {
				const cmd = task.shift()
				emit( cmd.cmd , cmd.data )
				return 
			}
			emit( SEND_CODE.CMD_PING , { 
				sid: sid ,
				time : parseInt( ( new Date() / 1000 ) )
			} )
		} , 5000)
	}
	
	reconnect()
	
	// 打开连接
	uni.onSocketOpen( res => {
		console.log("opened")
		isConnected = true
		// 连接成功 执行登录
		if ( Object.prototype.toString.call(startFn) == '[object Function]' ) {
			startFn()
		}
	})
	
	// 关闭连接
	uni.onSocketClose((res)=> {
		isConnected = false
		console.log("onClose",res)
		reconnect();
	})
	
	// 连接异常
	uni.onSocketError(res => {
		isConnected = false
		console.log("onError",JSON.stringify(res))
		reconnect();
	})
	
	// 消息接收
	const message = ( msg )=> {
		uni.onSocketMessage( res => {
			try{
				// console.log("接收信息",res.data)
				let data = JSON.parse(res.data)
				msg(data)
			}catch( err ) {
				uni.showToast({
					icon:"none",
					title:"Parsing failed"
				})
			}
		})
	}
	
	return {
		//  发送消息
		emit ,
		message 
	}
}