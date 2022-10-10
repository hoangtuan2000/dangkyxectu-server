// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration

// EMAIL student
// const firebaseConfig = {
//     apiKey: "AIzaSyAqydzhBFUVhRr9FTbKNcGBpTtIymlZQvg",
//     authDomain: "hethongdangkyxectu.firebaseapp.com",
//     projectId: "hethongdangkyxectu",
//     storageBucket: "hethongdangkyxectu.appspot.com",
//     messagingSenderId: "890009712232",
//     appId: "1:890009712232:web:1fb5b60983fdc33affaddd",
// };

// EMAIL hethongdangkyxe@gmail.com
const firebaseConfig = {
    apiKey: "AIzaSyALqjYyZVrGzeIEi56HEExsojReZcTf0Vk",
    authDomain: "hethongdangkyxectu-ff0cb.firebaseapp.com",
    projectId: "hethongdangkyxectu-ff0cb",
    storageBucket: "hethongdangkyxectu-ff0cb.appspot.com",
    messagingSenderId: "965791062309",
    appId: "1:965791062309:web:f81ea1b22933e367ef22cc"
  };

// Initialize Firebase
const appFirebase = initializeApp(firebaseConfig);
module.exports = {
    appFirebase,
};
