import React from 'react';
import './style.css';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import Login from './components/LoginComponent';
import Signup from './components/SignupComponent';
import Navbar from './components/NavbarComponent';
import Home from './components/HomeComponent';

function App() {
  return (
    <div className="App">
    <Router>
    <Navbar></Navbar>
    <Switch>
       <Route path="/login" exact component={Login}></Route>
       <Route path="/signup" exact component={Signup}></Route>
       <Route path="/home" exact component={Home}></Route>
       </Switch>
     </Router>
    </div>
  );
}

export default App;
