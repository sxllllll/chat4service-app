const HTTP_URL = "https://api.chat4service.com"
// const HTTP_URL = "http://192.168.5.199:8001"
const SSID_STORE = "chat4service_ssid"
const SESSION_CONFIG  = "chat4service_session_config"
export const CID_STORE = "chat4service_cid"
let Options = {
	cv_id:0,
	lang:"",
	avatar:"",
	name:"",
	url:"",
	system:"",
	way:"",
	cm_id:0
}
export default {
	// 开始信息对接
	httpStart ( company_id , opt = {} ){
		// uni.showLoading({
		// 	mask:true
		// })
		if ( opt && Object.prototype.toString.call(opt) == '[object Object]'){
			Object.keys(opt).forEach(key=> {
				if ( Options[key] !== undefined ) {
					Options[key] = opt[key]
				} 
			})
		}	
		var ssid = uni.getStorageSync( SSID_STORE )
		Options.ssid = ssid ? ssid : '';
		Options.cm_id = company_id
		return new Promise( (resolve, reject ) => {
			this.http("/msg" ,  Options ).then( ( {data} ) => {
				if ( data ) {
					// 存储 sid
					uni.setStorageSync( SSID_STORE , data.sid )
					// 存储配置
					uni.setStorage({
						key:SESSION_CONFIG,
						data: data.session_config?.configs
					})
					// uni.hideLoading()
					resolve(data)
				}else{
					reject(data)
				}
			}).catch(err => {
				reject(err)
				// uni.hideLoading()
			})
		} )
		
	},
	
	// 消息列表请求
	messages ( option ) {
		return new Promise( (resolve, reject ) => { 
			this.http( "/messages" , option ).then(res => {
				resolve(res.data)
			})
		})
	},
	
	//  上传文件
	upload( filePath ){
		return new Promise( (resolve, reject ) => {
			uni.uploadFile({
			  url: HTTP_URL + "/upload" ,
			  filePath: filePath,
			  name: "file",
			  success: (uploadFileRes) => {
					let data = uploadFileRes.data;
					if( Object.prototype.toString.call(data) == '[object String]' ){
						try {
							data = JSON.parse(data)
							resolve(data)
						}catch(e) {
							data = {}
							reject(e)
						}
					}
			  },
				fail(e) {
					console.log(e)
				}
			});
		})
	},
	
	// 获取客服状态
	serviceState(cm_id = 0){
		return new Promise( (resolve, reject ) => {
			this.http( "/service_online" , {company_id : cm_id } ).then(res => {
				resolve(res.data)
			})
		})
	},
	
	http(url , opt){
		return new Promise( ( resolve, reject )=> {
			uni.request({
				url:HTTP_URL + url,
				header: {
					'Content-Type' : "application/x-www-form-urlencoded",
				},
				data: { p: JSON.stringify( opt ) },
				sslVerify:false,
				method:'POST',
				success(res) {
					resolve(res.data)
				},
				fail(err) {
					console.log(err)
					reject(err)
				}
			})
		} )
	}
}