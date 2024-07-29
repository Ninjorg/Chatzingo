// App.js
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Navbar from './navbar';
import './index.css';


const socket = io.connect('http://localhost:4000');


const validUsers = [
 { username: 'user1', password: 'pass1', permissions: ['chat', 'chat2'] },
 { username: 'user2', password: 'pass2', permissions: ['chat'] },
 { username: 'admin', password: 'pass1', permissions: ['chat', 'chat2', 'chat3'] },
];


function App() {
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');
 const [message, setMessage] = useState('');
 const [chat, setChat] = useState([]);
 const [isLoggedIn, setIsLoggedIn] = useState(false);
 const [showLanding, setShowLanding] = useState(true);
 const [userPermissions, setUserPermissions] = useState([]);
 const chatContainerRef = useRef(null);


 useEffect(() => {
   const handleMessage = ({ username, message }) => {
     setChat((prevChat) => [...prevChat, { username, message }]);
   };


   socket.on('message', handleMessage);


   return () => {
     socket.off('message', handleMessage);
   };
 }, []);


 useEffect(() => {
   if (chatContainerRef.current) {
     chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
   }
 }, [chat]);


 const handleLogin = (e) => {
   e.preventDefault();
   const user = validUsers.find((user) => user.username === username && user.password === password);
   if (user) {
     setIsLoggedIn(true);
     setUserPermissions(user.permissions);
     setShowLanding(false);
   } else {
     alert('Not registered: Please contact Ronit Parikh to get this issue resolved.');
   }
 };


 const sendMessage = (e) => {
   e.preventDefault();
   if (message) {
     socket.emit('message', { username, message });
     setMessage('');
   }
 };


 const ChatRoom = ({ room }) => {
   const navigate = useNavigate();


   useEffect(() => {
     if (!userPermissions.includes(room)) {
       navigate('/chat');
     }
   }, [room, userPermissions, navigate]);


   return (
     <div>
       <h1>Chat Room {room.charAt(room.length - 1)}</h1>
       <div className="chat-container" ref={chatContainerRef}>
         {chat.map((payload, index) => (
           <p
             key={index}
             className={payload.username === username ? 'user-message' : 'other-message'}
           >
             <strong>{payload.username}:</strong> {payload.message}
           </p>
         ))}
       </div>
       <form className="message-form" onSubmit={sendMessage}>
         <input
           type="text"
           value={message}
           onChange={(e) => setMessage(e.target.value)}
           placeholder="Type a message..."
         />
         <button type="submit">Send</button>
       </form>
     </div>
   );
 };


 return (
   <Router>
     <Navbar />
     <div className="App">
       <Routes>
         <Route
           path="/"
           element={
             <div className="landing-page">
               <div className="banner">
                 <h1>What is Collabo</h1>
               </div>
               <div className="content">
                 <p>
                   Created by Ronit, Collabo offers a platform for students to collaborate and work on projects together. Our aim is to foster creativity and teamwork through seamless collaboration tools and resources.
                 </p>
                 <div className="button-container">
                   <button onClick={() => setShowLanding(false)}>Enter</button>
                 </div>
               </div>
             </div>
           }
         />
         <Route
           path="/chat"
           element={
             !isLoggedIn ? (
               <form onSubmit={handleLogin}>
                 <input
                   type="text"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                   placeholder="Enter your username..."
                   required
                 />
                 <input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="Enter your password..."
                   required
                 />
                 <button type="submit">Join Chat</button>
               </form>
             ) : (
               <ChatRoom room="chat" />
             )
           }
         />
         <Route
           path="/chat2"
           element={
             !isLoggedIn ? (
               <form onSubmit={handleLogin}>
                 <input
                   type="text"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                   placeholder="Enter your username..."
                   required
                 />
                 <input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="Enter your password..."
                   required
                 />
                 <button type="submit">Join Chat</button>
               </form>
             ) : (
               <ChatRoom room="chat2" />
             )
           }
         />
         <Route
           path="/chat3"
           element={
             !isLoggedIn ? (
               <form onSubmit={handleLogin}>
                 <input
                   type="text"
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                   placeholder="Enter your username..."
                   required
                 />
                 <input
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="Enter your password..."
                   required
                 />
                 <button type="submit">Join Chat</button>
               </form>
             ) : (
               <ChatRoom room="chat3" />
             )
           }
         />
         <Route
           path="/about"
           element={
             <div className="about-page">
               <h1>About Collabo</h1>
               <p>
                 Collabo is a platform designed to help students collaborate on projects and ideas. Whether you're working on a school project, a startup idea, or just want to brainstorm with others, Collabo provides the tools and community to make it happen.
               </p>
             </div>
           }
         />
       </Routes>
     </div>
   </Router>
 );
}


export default App;



Server.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';


const socket = io.connect('http://localhost:4000');


function App() {
 const [username, setUsername] = useState('');
 const [message, setMessage] = useState('');
 const [chat, setChat] = useState([]);
 const [isLoggedIn, setIsLoggedIn] = useState(false);


 useEffect(() => {
   socket.on('message', ({ username, message }) => {
     setChat([...chat, { username, message }]);
   });
 }, [chat]);


 const handleLogin = (e) => {
   e.preventDefault();
   if (username) {
     setIsLoggedIn(true);
   }
 };


 const sendMessage = (e) => {
   e.preventDefault();
   if (message) {
     socket.emit('message', { username, message });
     setMessage('');
   }
 };


 return (
   <div className="App">
     {!isLoggedIn ? (
       <form onSubmit={handleLogin}>
         <input
           type="text"
           value={username}
           onChange={(e) => setUsername(e.target.value)}
           placeholder="Enter your username..."
           required
         />
         <button type="submit">Join Chat</button>
       </form>
     ) : (
       <div>
         <h1>Chat Room</h1>
         <div className="chat-container">
           {chat.map((payload, index) => (
             <p key={index}><strong>{payload.username}:</strong> {payload.message}</p>
           ))}
         </div>
         <form onSubmit={sendMessage}>
           <input
             type="text"
             value={message}
             onChange={(e) => setMessage(e.target.value)}
             placeholder="Type a message..."
           />
           <button type="submit">Send</button>
         </form>
       </div>
     )}
   </div>
 );
}


export default App;
