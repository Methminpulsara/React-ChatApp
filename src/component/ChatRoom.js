import React, { useState } from 'react'
import { over } from 'stompjs';
import Sockjs from 'sockjs-client'

function ChatRoom() {

    var stomClient = null;


    const [publicChats, setPublicChats] = useState([])
    const [privateChats, setprivateChats] = useState([new Map()])


    const [userData, setUserdata] = useState({
        userName: "",
        reciverName: "",
        connected: false,
        message: "",
    });

    const handleUserName = (event) => {
        const { value } = event.target;
        setUserdata({ ...userData, userName: value });
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
    }

    const OnPublicMessageRecived =(payload)=>{
        let payloadData = JSON.parse(payload.body);
        switch(payloadData.status){
            case "JOIN":
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
            privateChats.set(payloadData.senderName,[payloadData])
        }
    }


    }

    return (
        <div className='contatiner'>
            {userData.connected ?
                <div>

                </div>
                :
                <div className='register'>
                    <input
                        id='user.name'
                        placeholder='enter user name'
                        value={userData.userName}
                        onChange={handleUserName} />
                    <button type='button' onClick={registrUser}>
                        connect
                    </button>
                </div>}
        </div>

    );
}

export default ChatRoom
