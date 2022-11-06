
//  发送的状态
export const SEND_CODE = {
	CMD_MSG: 2,  // 发送信息
	CMD_STATE_LOGIN: 1,  // 初始登录
	CMD_WRITE: 3,  //  输入状态
	CMD_CHECK_MESSAGE: 10 ,//
	CMD_PING: 5 // 心跳检测
}

export const REVICE_CODE = {
	MSG_SOCKET_CLOSEL: '5008', // socket 关闭
	MSG_STATE_MSG: '5007', // 接受到消息
	MSG_STATE_LOGIN_ERROR: '0', // 客服不在线
	MSG_STATE_LOGIN_SUCCESS: '1', // 客服在线
	MSG_STATE_BY_WAIT: '5002',  // 等待客服接入
	MSG_CUSTOM_CONNECT_SUCCESS: '5006', // 客户接入成功
	MSG_SEND_PONG: '5005', //  ping
	MES_INREAD: '5011', //  消息已读
	MES_INREAD_ERROR: '5012', //  设置已读消息状态错误
	MSG_STATE_BY_NOT_SERVICE: '5000', //  客服不在线
	MSG_TRANSFER_SUCCESS: '5014',  // 客服转接用户成功
	MSG_UP_CONFIG: '5020', // 修改会话配置]
	MSG_REBACK_MESSAGE: '5021', // 消息撤回
	MSG_TRANSFER_MESSAGE: '5022' // 翻译语言返回
}

export default {
	// 登录
	Login(){
		if ( this.emit ) {
			console.log("Login ... ")
			this.emit( SEND_CODE.CMD_STATE_LOGIN ,  { ...this.visitor } )
		} 
	},
	// 用户 SOCKET 注册成功,加载聊天信息
	[ REVICE_CODE.MSG_STATE_LOGIN_SUCCESS ]:function(res){
		console.log("REGISTER SOCKET SUCCESSFUL .")
		if( this.chat.list.length > 0 ) {
			return false;
		}
		this.opacity = 0
		this.loadMessages().then(()=> {
			console.log("loadMessages")
			this.$nextTick(() => {
				this.scrollIntoBottom()
				this.opacity = 1
			})
		})
	} ,
	// 登录分配客服
	[REVICE_CODE.MSG_STATE_BY_WAIT] : function(data){
		this.service_status = 2;
	},
	// 客服不在线
	[ REVICE_CODE.MSG_STATE_LOGIN_ERROR ] : function(res) {
		this.service_status = 0
		console.log("SERVICE OFFLINE .")
	},
	// 会话配置修改
	[REVICE_CODE.MSG_UP_CONFIG] : function(res) {
		console.log("SESSION CONFIG UPDATE.")
		if( res ) {
			this.parseSessionConfig(res)
			this.$nextTick(()=> {
				this.scrollIntoBottom(0)
			})
		}
	},
	//  客服登录上线
	[ REVICE_CODE.MSG_CUSTOM_CONNECT_SUCCESS ]: function(res) {
		console.log("SERVICE ONLINE .")
		this.service_status = 1;
	},
	// 接收到消息
	[REVICE_CODE.MSG_STATE_MSG]:function(data) {
		console.log("RECEVICE MESSAGE .")
		this.chat.list.push(data)
		// 通知父级收到消息
		this.$emit("message" , data)
		this.$nextTick(()=> {
			 // 通知客服 消息已读
			this.emit( SEND_CODE.CMD_CHECK_MESSAGE , {
				visitor: this.visitor.vistor_id,
				cid: this.visitor.cid,
				company_id: this.visitor.company_id,
			})
			this.scrollIntoBottom(3)
			uni.hideLoading()
		})
	},
	// 消息已读
	[REVICE_CODE.MES_INREAD] : function(data) {
		console.log("MESSAGE READ")
		this.chat.list = this.chat.list.map(item => {
			if( item.chat_type < 0 ) {
				item.readstate = 1;
			}
			return item;
		})
	},
	// 客服转接成功
	[REVICE_CODE.MSG_TRANSFER_SUCCESS]: function(data){ 
		console.log("SERVICE TRANSFER")
		this.visitor.cid = data.ccid;
		this.visitor.vistor_id = data.id;
	},
	// 消息撤回
	[REVICE_CODE.MSG_REBACK_MESSAGE]: function(data){
		console.log("MESSAGE REBACK")
		if( data ) {
			let index = this.chat.list.findIndex(item => item.key == data)
			if( index != -1 ) {
				this.$set(this.chat.list[index] , 'is_del'  , -1 )
			}
		}
	},
	 //  语言翻译返回
	[REVICE_CODE.MSG_TRANSFER_MESSAGE] : function(data) {
		console.log("TRANSFER LANG")
		if ( data && data.key != 0) {
			let index = this.chat.list.findIndex(item => item.key == data.key)
			if ( index != -1) {
				this.$set(this.chat.list[index] , 'transfer'  , data.transfer  )
			}
		}
	}
}