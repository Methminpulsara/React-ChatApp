import React, { useState } from 'react'
import { over } from 'stompjs';
import Sockjs from 'sockjs-client'

function ChatRoom() {

    var stomClient = null;


    const [publicChats, setPublicChats] = useState([])
    const [privateChats, setprivateChats] = useState([new Map()])
    const [tab, setTab] =useState("CHATROOM")
    const [userData, setUserdata] = useState({
        userName: "",
        reciverName: "",
        connected: false,
        message: "",
    });

    const handleValue = (event) => {
        const { value, name } = event.target;
        setUserdata({ ...userData, [name]: value });
    };

    


    const registerUser = () => {
      let Sock = new Sockjs("http://localhost:8080/ws");
      stomClient =over(Sock);
      stomClient.connect({},onConnected,onError);

    };

    const onConnected =()=>{
        setUserdata({ ...userData, connected: true });
        stomClient.subscribe("/chatroom/public",OnPublicMessageRecived)
        stomClient.subscribe("/user/"+userData.userName+"/private", onPrivateMessageRevived);
        userLoging();
    }

    const userLoging=()=>{
        let chatMessage={
            senderName:userData.userName,
            message:userData.message,
            status:"JOIN"
        }
        stomClient.send("/app/message", {} ,JSON.stringify(chatMessage));
        
    }
     
        

    const OnPublicMessageRecived =(payload)=>{
        let payloadData = JSON.parse(payload.body);
        switch(payloadData.status){
            case "JOIN":
                if(privateChats.get(payloadData.senderName)){
                    privateChats.set(payloadData.senderName,[])
                    setprivateChats(new Map(privateChats))
                }

                break;
            case  "MESSAGE":
                publicChats.push(payloadData);
                setPublicChats([...publicChats])
                break;
        }
    }

    const onError =(err)=>{
        console.log(err)
    }

    const onPrivateMessageRevived =(payload)=>{
        let payloadData = JSON.parse(payload);
        if(privateChats.get(payloadData.senderName)){
            privateChats.get(payloadData.senderName).push(payloadData);
            setprivateChats(new Map(privateChats))
        }else{
           let list = [];
           list.push(payload);

           privateChats.set(payloadData.senderName , list);
           setprivateChats(new Map(privateChats))
        }
    }

    const sendPrivateMessage =()=>{
        if(stomClient){
            let chatMessage={
                senderName:userData.userName,
                reciverName:tab,
                message:userData.message,
                status:"MESSAGE"
            };

            if(userData.userName !== tab){
                 privateChats.set(tab).push(chatMessage);
                 setprivateChats(new Map(privateChats))
            }

            stomClient.send("/app/private-message",{},JSON.stringify(chatMessage))
            setUserdata({ ...userData, message: "" });
        }
    }

        const sendPublicMessage =()=>{
        if(stomClient){
            let chatMessage={
                senderName:userData.userName,
                message:userData.message,
                status:"MESSAGE"
            };

            stomClient.send("/app/message",{},JSON.stringify(chatMessage))
            setUserdata({ ...userData, message: "" });
        }
    }
        
    


    
    return (
      <div className="contatiner">
        {userData.connected ? (
          <div className="member-list">
            <ul>
              <li
                onClick={() => {
                  setTab("CHATROOM");
                }}
                className={'member ${ tab ==="CHATROOM" && "active"}'}>ChatRoom</li>
              {[...privateChats.keys()].map((name, index) => {
                <li onClick={()=>{setTab(name);}} className={'member ${ tab === name && "active"}'} key={index}>
                  {name}
                </li>;
              })}
            </ul>

            {tab === "CHATROOM" && (
              <div className="chat-content">
                <ul className='chat-message'>
                {publicChats.map((chat, index) => {
                    <li className="message" key={index}>
                      {chat.senderName !== userData.userName && (
                        <div className="avater">{chat.senderName}</div>
                      )}
                      <div className="message-data">{chat.message}</div>
                      {chat.senderName === userData.userName && (
                        <div className="avater-self">{chat.senderName}</div>
                      )}
                    </li>;
                  })}
                  </ul>

                  <div className='send-message'>
                    <input
                        type='text' className='input-message' placeholder='enter public message' value={userData.message}
                        onChange={handleValue}
                    />
                    <button type='button' className='send-button' onClick={sendPublicMessage}> send </button>
                  </div>


              </div>
            )}

            {tab !== "CHATROOM" && (
              <div className="chat-content">
                  <ul className='chat-message'>
                {[
                  ...privateChats.get(tab)].map((chat, index) => {
                    <li className="message" key={index}>
                      {chat.senderName !== userData.userName && (
                        <div className="avater">{chat.senderName}</div>
                      )}
                      <div className="message-data">{chat.message}</div>
                      {chat.senderName === userData.userName && (
                        <div className="avater-self">{chat.senderName}</div>
                      )}
                    </li>;
                  })}
                  </ul>
                    <div className='send-message'>
                    <input
                        type='text' className='input-message' placeholder={'enter private message for ${tab}'} value={userData.message}
                        onChange={handleValue}
                    />
                    <button type='button' className='send-button' onClick={sendPrivateMessage}> send </button>
                  </div>

              </div>
            )}
          </div>
        ) : (
          <div className="register">
            <input
                name='username'
              id="user.name"
              placeholder="enter user name"
              value={userData.userName}
              onChange={handleValue}
            />
            <button type="button" onClick={registerUser}>
              connect
            </button>
          </div>
        )}
      </div>
    );
}

export default ChatRoom
