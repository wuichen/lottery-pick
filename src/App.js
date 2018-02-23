import React, { Component } from 'react';
import './App.css';
import * as firebase from 'firebase';
import generateID from './unique-id-generator'
import { Switch, Route, Link, Redirect } from 'react-router-dom'
import $ from 'jquery'

var config = {
  apiKey: 'AIzaSyDpmXX6pQGuq6QKMvCr0URgJH-wG3PNToU',
  authDomain: 'lottery-e5e54.firebaseapp.com',
  databaseURL: 'https://lottery-e5e54.firebaseio.com',
  projectId: 'lottery-e5e54',
  storageBucket: 'lottery-e5e54.appspot.com',
  messagingSenderId: '1036732123145'
};
firebase.initializeApp(config);
const storage = firebase.storage();

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      searchText: '',
      modifyingInput: null,
      modifying: null,
      coverPhotoDisplay: null,
      coverPhoto: null,
      lastId: 0,
      loggedIn: false,
      settingDisplay: null,
      setting: [],
      adminUsername: '',
      adminPassword: '',
      inputBID: '',
      inputAID: '',
      inputAArray: [
        {
          id: 0,
          name: '',
          note: '',
          file: ''
        }
      ],
      tableA: [

      ],
      filterTable: []
    };
  }

  addInputA() {

    let lastInputId = this.state.inputAArray[this.state.inputAArray.length - 1].id
    this.state.inputAArray.push({
      id: lastInputId + 1,
      name: '',
      note: '',
      file: ''
    })
    this.setState({
      inputAArray: this.state.inputAArray
    })
  }

  handleInputANameChange(index, e) {
    this.state.inputAArray[index].name = e.target.value;
    this.setState({
      inputAArray: this.state.inputAArray
    })
  }

  handleInputANoteChange(index, e) {
    this.state.inputAArray[index].note = e.target.value;
    this.setState({
      inputAArray: this.state.inputAArray
    })
  }

  async submit() {
    let proceed = true
    for (var i = 0; i < this.state.inputAArray.length; i++) {
      if (this.state.inputAArray[i].name.length === 0 || this.state.inputAArray[i].note.length === 0) {
        proceed = false
      }    
    }

    const here = this
    if (!proceed) {
      alert('Please fill in all the required fields!')
    } else {
      let uploadFirebase = (input) => {
            return new Promise(resolve => {
              firebase.database().ref('inputA/' + input.id).set(input).then((snapshot) => {
                firebase.database().ref('lastId').set(this.state.lastId + 1)
                this.setState({
                  lastId: this.state.lastId + 1
                })
                if (input.file) {
                  const ref = firebase.storage().ref('inputA/' + input.id)
                  ref.put(input.file).then((snapshot2) => {
                    firebase.database().ref('inputA/' + input.id + '/fileUrl').set(snapshot2.downloadURL).then((snapshot) => {
                      alert('image submitted')
                      resolve()
                    })
                  })
                } else {
                  resolve()
                }
              })
            });
        };
        // map over forEach since it returns

        let actions = this.state.inputAArray.map(uploadFirebase); // run the function over all items

        // we now have a promises array and we want to wait for it

        await Promise.all(actions); // pass array of promises
        alert('uploaded A!')

        firebase.database().ref('lastId').once('value').then((snapshot) => {
          this.setState({
            inputAArray: [{
              id: snapshot.val() + 1,
              name: '',
              note: '',
              file: ''
            }]
          })
        })

    }
  }

  handleInputAFileChange(index, e) {
    this.state.inputAArray[index].file = e.target.files[0]
    this.setState({
      inputAArray: this.state.inputAArray
    })
  }

  delete(index) {
    this.state.inputAArray.splice(index, 1)
    this.setState({
      inputAArray: this.state.inputAArray
    })
  }

  componentDidMount() {

    firebase.storage().ref('coverPhoto').getDownloadURL().then((url) => {
      this.setState({
        coverPhotoDisplay: url
      })
    })

    firebase.database().ref('lastId').once('value').then((snapshot) => {
      this.setState({
        lastId: snapshot.val(),
        inputAArray: [
          {
            id: snapshot.val() + 1,
            name: '',
            note: '',
            file: ''
          }
        ]
      })
    })

    firebase.database().ref('setting').once('value').then((snapshot) => {
      let settingArray = []
      for (let setting in snapshot.val()) {
        settingArray.push({
          key: setting,
          value: snapshot.val()[setting]
        })
      }
      this.setState({
        setting: snapshot.val(),
        settingData: settingArray
      })
    })

    firebase.database().ref('inputA').on('value', (snapshot) => {
      if (snapshot.val()) {
        let newArray = []
        for(let input in snapshot.val()) {
          newArray.push(snapshot.val()[input])
        }
        this.setState({
          tableA: newArray
        })
      }
    })
  }

  handleInputAID(e) {
    this.setState({
      inputAID: e.target.value
    })
  }

  handleInputBID(e) {
    this.setState({
      inputBID: e.target.value
    })
  }

  submitB() {
    if (this.state.inputBID.length > 0 && this.state.inputAID.length > 0) {
      firebase.database().ref('inputA/' + this.state.inputAID).once('value').then((snapshot) => {
        if (snapshot.val()) {
          firebase.database().ref('inputA/' + this.state.inputAID + '/inputB').set(this.state.inputBID).then(() => {
            alert(this.state.inputAID + ' is binded with ' + this.state.inputBID)
            this.setState({
              inputBID: '',
              inputAID: ''
            })
          })
        } else {
          alert('A ID doesnt exist')
        }
      })
    } else {
      alert('Please fill in A ID and B ID!')
    }
    
  }

  handleAdminUsername(e) {
    this.setState({
      adminUsername: e.target.value
    })
  }

  handleAdminPassword(e) {
    this.setState({
      adminPassword: e.target.value
    })
  }

  login() {
    firebase.database().ref('credentials').once('value').then((snapshot) => {
      if (this.state.adminUsername == snapshot.val().username && this.state.adminPassword == snapshot.val().password) {
        this.setState({
          loggedIn: true
        })
      } else {
        alert((this.state.setting && this.state.setting.AdminLoginError) ? this.state.setting.AdminLoginError : 'wrong password or username')
      }
    })
  }

  handleSettingChange(setting, index,e) {
    let newSetting = this.state.settingData
    newSetting[index].newValue = e.target.value
    this.setState({
      settingData: newSetting
    })
  }

  submitSetting(setting, index) {
    if (this.state.settingData[index].newValue) {
      firebase.database().ref('setting/' + this.state.settingData[index].key).set(this.state.settingData[index].newValue).then(() => {
        alert((this.state.setting && this.state.setting.settingUpdateSucceed) ? this.state.setting.settingUpdateSucceed : 'updated')

      })
    } else {
      alert((this.state.setting && this.state.setting.settingUpdateError) ? this.state.setting.settingUpdateError : 'please fill in a new value')
    }
  }

  logout() {
    this.setState({
      loggedIn: false
    })
  }

  deleteAll() {
    firebase.database().ref().child('inputA').remove().then(() => {
      firebase.database().ref('lastId').set(0)
      this.setState({
        tableA: [],
        lastId: 0,
        inputAArray: [
          {
            id: 1,
            name: '',
            note: '',
            file: ''
          }
        ]
      })
    })
  }

  handleCoverPhotoChange(e) {
    this.setState({
      coverPhoto: e.target.files[0]
    })
  }

  submitCoverPhoto() {
    if (this.state.coverPhoto) {
      const ref = firebase.storage().ref('coverPhoto')
      ref.put(this.state.coverPhoto).then((snapshot) => {
        this.setState({
          coverPhotoDisplay: snapshot.downloadURL
        })
        alert('image uploaded!')
      })
    }
  }

  modify(input, index) {
    this.setState({
      modifying: Object.assign({}, input)
    })

  }

  remove(input, index) {
    firebase.database().ref('inputA/' + input.id).remove()
  }

  submitModify(input, index) {


    firebase.database().ref('inputA/' + input.id).set(this.state.modifying).then((snapshot) => {
      console.log(snapshot, input)
      if (this.state.modifying.file) {
        const ref = firebase.storage().ref('inputA/' + input.id)
        ref.put(this.state.modifying.file).then((snapshot2) => {
          firebase.database().ref('inputA/' + input.id + '/fileUrl').set(snapshot2.downloadURL).then((snapshot) => {
            alert('image submitted')
          })
        })
      }
      this.setState({
        modifying: null
      })
    })
  }

  handleModifyChange(type, e) {
    this.state.modifying[type] = e.target.value
    this.setState({
      modifying: this.state.modifying
    })

  }

  handleModifyFile(e) {
    this.state.modifying.file = e.target.files[0]
    this.setState({
      modifying: this.state.modifying
    })
  }

  cancelModify() {
    this.setState({
      modifying: null
    })
  }

  filterTable(e) {
    this.setState({
      filterTable: []
    })

    this.setState({
      searchText: e.target.value
    }, () => {
      for (var i = this.state.tableA.length - 1; i >= 0; i--) {
        for(let element in this.state.tableA[i]) {
            if (this.state.tableA[i][element].toString().includes(this.state.searchText)) {
              this.state.filterTable.push(this.state.tableA[i])
            }
        }
      }
      this.setState({
        filterTable: this.state.filterTable
      })

    })
  }

  scroll() {
    $("body, html").animate({scrollTop:$('.results')[0].clientHeight}, 30000, 'linear', () => {
      $("body, html").animate({scrollTop:0}, 30000, 'linear')
    });
    setInterval(() => {
      $("body, html").animate({scrollTop:$('.results')[0].clientHeight}, 30000, 'linear', () => {
        $("body, html").animate({scrollTop:0}, 30000, 'linear')
      });
    }, 30000)
  }

  render() {
    return (
      <div>
        <img className='coverPhoto' width='100%' src={this.state.coverPhotoDisplay ? this.state.coverPhotoDisplay : 'http://via.placeholder.com/800x150'} />
        <Switch>
          <Route exact path="/" render={() => (
              <Redirect to="/inputa"/>
          )}/>

          <Route path='/inputA' render={() => (
            <div className='inputA'>
              <h3>{(this.state.setting && this.state.setting.inputATitle) ? this.state.setting.inputATitle : 'Input A'}</h3>
              {this.state.inputAArray.map((input, index) => {
                return (
                  <div key={input.id} className='card inputBoxA'>
                    <p className='inputId'>
                      {(this.state.setting && this.state.setting.idTitle) ? this.state.setting.idTitle : 'ID :'} {input.id}
                    </p>
                    <div>
                      <input onChange={this.handleInputANameChange.bind(this, index)} placeholder={(this.state.setting && this.state.setting.inputANamePlaceholder) ? this.state.setting.inputANamePlaceholder : 'A name'} className={input.name.length === 0 ? 'form-control is-invalid' : 'form-control'} />
                    </div>
                    <br />
                    <div>
                      <input onChange={this.handleInputANoteChange.bind(this, index)} placeholder={(this.state.setting && this.state.setting.inputANotePlaceholder) ? this.state.setting.inputANotePlaceholder : 'A note'} className={input.note.length === 0 ? 'form-control is-invalid' : 'form-control'}  />
                    </div>
                    <br />
                    <div>
                      <input onChange={this.handleInputAFileChange.bind(this, index)} type='file' />
                    </div>
                    <br />
                    <div>
                      <button type='button' className='btn btn-danger' onClick={this.delete.bind(this, index)}>{(this.state.setting && this.state.setting.delete) ? this.state.setting.delete : 'delete'}</button>
                    </div>
                    <br />
                  </div>
                )
              })}
              <div className='buttons'>
                <button type='button' onClick={this.addInputA.bind(this)} className='btn btn-success'>+</button>
                &nbsp;
                <button type='button' className='btn btn-primary' onClick={this.submit.bind(this)}>{(this.state.setting && this.state.setting.inputSubmit) ? this.state.setting.inputSubmit : 'Submit'}</button>
              </div>
              <div className='buttons'>
                <Link to='/result'>{(this.state.setting && this.state.setting.ResultPage) ? this.state.setting.ResultPage : 'Result'}</Link>
                &nbsp;&nbsp;&nbsp;
                <Link to='/inputB'>{(this.state.setting && this.state.setting.inputBTitle) ? this.state.setting.inputBTitle : 'Input B'}</Link>
              </div>

              <div className='adminLinkBox'>
                <Link to='/admin'>{(this.state.setting && this.state.setting.AdminLogin) ? this.state.setting.AdminLogin : 'Admin login'}</Link>
              </div>
            </div>
          )}/>
          <Route path='/inputB' render={() => (
            <div className='inputA'>
              <h3>{(this.state.setting && this.state.setting.inputBTitle) ? this.state.setting.inputBTitle : 'Input B'}</h3>

                  <div className='card inputBoxA'>
                    <div>
                      <input onChange={this.handleInputAID.bind(this)} placeholder={(this.state.setting && this.state.setting.inputAID) ? this.state.setting.inputAID : 'Input A ID'} className={this.state.inputAID.length === 0 ? 'form-control is-invalid' : 'form-control'} />
                    </div>
                    <br />
                    <div>
                      <input onChange={this.handleInputBID.bind(this)} placeholder={(this.state.setting && this.state.setting.inputBID) ? this.state.setting.inputBID : 'Input B ID'} className={this.state.inputBID.length === 0 ? 'form-control is-invalid' : 'form-control'}  />
                    </div>
                    <br />
                  </div>

              <div className='buttons'>
                <button type='button' className='btn btn-primary' onClick={this.submitB.bind(this)}>{(this.state.setting && this.state.setting.inputSubmit) ? this.state.setting.inputSubmit : 'Submit'}</button>
              </div>
              <div className='buttons'>
                <Link to='/result'>{(this.state.setting && this.state.setting.ResultPage) ? this.state.setting.ResultPage : 'Result'}</Link>
                &nbsp;&nbsp;&nbsp;
                <Link to='/inputa'>{(this.state.setting && this.state.setting.inputATitle) ? this.state.setting.inputATitle : 'Input A'}</Link>
              </div>
              <div className='adminLinkBox'>
                <Link to='/admin'>{(this.state.setting && this.state.setting.AdminLogin) ? this.state.setting.AdminLogin : 'Admin login'}</Link>
              </div>
            </div>
          )}/>

          <Route path='/publicresult' render={() => (
            <div className='results'>
              <button type='button' className='btn btn-primary' onClick={this.scroll.bind(this)}>Scroll</button>

              <input placeholder='search' type='text' className='form-control search' onChange={this.filterTable.bind(this)} />
              {this.state.searchText.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr key='column'>
                        <th scope="col">{(this.state.setting && this.state.setting.inputAID) ? this.state.setting.inputAID : 'Input A ID'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputAName) ? this.state.setting.inputAName : 'Input A Name'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputANote) ? this.state.setting.inputANote : 'Input A Note'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputAImage) ? this.state.setting.inputAImage : 'Input A Image'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputBID) ? this.state.setting.inputBID : 'Input B ID'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.filterTable.map((input) => {
                        return(
                          <tr key={input.id}>
                            {input.id ? (<td className='inputIdBox'>{input.id}</td>) : (<td></td>)}
                            {input.name ? (<td>{input.name}</td>) : (<td></td>)}
                            {input.note ? (<td>{input.note}</td>) : (<td></td>)}
                            {input.fileUrl ? (<td><img className='inputAImage' src={input.fileUrl} /></td>) : (<td></td>)}
                            {input.inputB ? (<td>{input.inputB}</td>) : (<td></td>)}

                          </tr>
                        )
                      })}
                    </tbody>
                  </table>


                ) : (
                  <table className="table">
                    <thead>
                      <tr key='column'>
                        <th scope="col">{(this.state.setting && this.state.setting.inputAID) ? this.state.setting.inputAID : 'Input A ID'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputAName) ? this.state.setting.inputAName : 'Input A Name'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputANote) ? this.state.setting.inputANote : 'Input A Note'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputAImage) ? this.state.setting.inputAImage : 'Input A Image'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputBID) ? this.state.setting.inputBID : 'Input B ID'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.tableA.map((input) => {
                        return(
                          <tr key={input.id}>
                            {input.id ? (<td className='inputIdBox'>{input.id}</td>) : (<td></td>)}
                            {input.name ? (<td>{input.name}</td>) : (<td></td>)}
                            {input.note ? (<td>{input.note}</td>) : (<td></td>)}
                            {input.fileUrl ? (<td><img className='inputAImage' src={input.fileUrl} /></td>) : (<td></td>)}
                            {input.inputB ? (<td>{input.inputB}</td>) : (<td></td>)}

                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                )}
              
            </div>
          )}/>
          <Route path='/result' render={() => (
            <div className='results'>

              <button type='button' className='btn btn-primary' onClick={this.deleteAll.bind(this)}>{(this.state.setting && this.state.setting.deleteAll) ? this.state.setting.deleteAll : 'Delete All'}</button>

              <input placeholder='search' className='form-control search' type='text' onChange={this.filterTable.bind(this)} />
              {this.state.searchText.length > 0 ? (
                  <table className="table">
                    <thead>
                      <tr key='column'>
                        <th scope="col">{(this.state.setting && this.state.setting.inputAID) ? this.state.setting.inputAID : 'Input A ID'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputAName) ? this.state.setting.inputAName : 'Input A Name'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputANote) ? this.state.setting.inputANote : 'Input A Note'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputAImage) ? this.state.setting.inputAImage : 'Input A Image'}</th>
                        <th scope="col">{(this.state.setting && this.state.setting.inputBID) ? this.state.setting.inputBID : 'Input B ID'}</th>
                        <th scope="col">modify</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.filterTable.map((input, index) => {
                        if (this.state.modifying && this.state.modifying.id == input.id) {
                          return (
                            <tr key={input.id}>
                              <td></td>
                              <td><input onChange={this.handleModifyChange.bind(this, 'name')} placeholder={input.name} type='text' className='form-control' /></td>
                              <td><input onChange={this.handleModifyChange.bind(this, 'note')} placeholder={input.note} type='text' className='form-control' /></td>
                              <td><input onChange={this.handleModifyFile.bind(this)} type='file' /></td>
                              <td><input onChange={this.handleModifyChange.bind(this, 'inputB')} placeholder={input.inputB} type='text' className='form-control' /></td>
                              <td><button className='btn btn-primary' onClick={this.submitModify.bind(this, input, index)}>submit</button><button className='btn btn-danger' onClick={this.cancelModify.bind(this, input, index)}>cancel</button></td>
                              

                            </tr>
                          )
                        } else {
                          return(
                            <tr key={input.id}>
                              {input.id ? (<td className='inputIdBox'>{input.id}</td>) : (<td></td>)}
                              {input.name ? (<td>{input.name}</td>) : (<td></td>)}
                              {input.note ? (<td>{input.note}</td>) : (<td></td>)}
                              {input.fileUrl ? (<td><img className='inputAImage' src={input.fileUrl} /></td>) : (<td></td>)}
                              {input.inputB ? (<td>{input.inputB}</td>) : (<td></td>)}
                              <td><button className='btn btn-primary' onClick={this.modify.bind(this, input, index)}>modify</button><button onClick={this.remove.bind(this, input, index)} className='btn btn-danger'>delete</button></td>
                            </tr>
                          )
                        }
                      })}
                    </tbody>
                  </table>
              ) : (

                <table className="table">
                  <thead>
                    <tr key='column'>
                      <th scope="col">{(this.state.setting && this.state.setting.inputAID) ? this.state.setting.inputAID : 'Input A ID'}</th>
                      <th scope="col">{(this.state.setting && this.state.setting.inputAName) ? this.state.setting.inputAName : 'Input A Name'}</th>
                      <th scope="col">{(this.state.setting && this.state.setting.inputANote) ? this.state.setting.inputANote : 'Input A Note'}</th>
                      <th scope="col">{(this.state.setting && this.state.setting.inputAImage) ? this.state.setting.inputAImage : 'Input A Image'}</th>
                      <th scope="col">{(this.state.setting && this.state.setting.inputBID) ? this.state.setting.inputBID : 'Input B ID'}</th>
                      <th scope="col">modify</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.tableA.map((input, index) => {
                      if (this.state.modifying && this.state.modifying.id == input.id) {
                        return (
                          <tr key={input.id}>
                            <td></td>
                            <td><input onChange={this.handleModifyChange.bind(this, 'name')} placeholder={input.name} type='text' className='form-control' /></td>
                            <td><input onChange={this.handleModifyChange.bind(this, 'note')} placeholder={input.note} type='text' className='form-control' /></td>
                            <td><input onChange={this.handleModifyFile.bind(this)} type='file' /></td>
                            <td><input onChange={this.handleModifyChange.bind(this, 'inputB')} placeholder={input.inputB} type='text' className='form-control' /></td>
                            <td><button className='btn btn-primary' onClick={this.submitModify.bind(this, input, index)}>submit</button><button className='btn btn-danger' onClick={this.cancelModify.bind(this, input, index)}>cancel</button></td>
                            

                          </tr>
                        )
                      } else {
                        return(
                          <tr key={input.id}>
                            {input.id ? (<td className='inputIdBox'>{input.id}</td>) : (<td></td>)}
                            {input.name ? (<td>{input.name}</td>) : (<td></td>)}
                            {input.note ? (<td>{input.note}</td>) : (<td></td>)}
                            {input.fileUrl ? (<td><img className='inputAImage' src={input.fileUrl} /></td>) : (<td></td>)}
                            {input.inputB ? (<td>{input.inputB}</td>) : (<td></td>)}
                            <td><button className='btn btn-primary' onClick={this.modify.bind(this, input, index)}>modify</button><button onClick={this.remove.bind(this, input, index)} className='btn btn-danger'>delete</button></td>
                          </tr>
                        )
                      }
                    })}
                  </tbody>
                </table>
              )}
              

              
              <div className='buttons'>
                <Link to='/inputA'>{(this.state.setting && this.state.setting.inputATitle) ? this.state.setting.inputATitle : 'Input A'}</Link>
                &nbsp; &nbsp; &nbsp;
                <Link to='/inputB'>{(this.state.setting && this.state.setting.inputBTitle) ? this.state.setting.inputBTitle : 'Input B'}</Link>
              </div>
              <div className='adminLinkBox'>
                <Link to='/admin'>{(this.state.setting && this.state.setting.AdminLogin) ? this.state.setting.AdminLogin : 'Admin login'}</Link>
              </div>
            </div>
          )}/>

          <Route path='/admin' render={() => (
            <div>
            {this.state.loggedIn ? (
              <div className='inputA'>
                <h3>{(this.state.setting && this.state.setting.AdminSetting) ? this.state.setting.AdminSetting : 'Admin Setting'}</h3>
                {this.state.settingData.map((setting, index) => {
                  return (
                    <div className='settingBlock' key={setting.key}>
                      <input onChange={this.handleSettingChange.bind(this, setting, index)} placeholder={setting.value} className='form-control inputBoxA' />
                      <button type='button' className='btn btn-primary' onClick={this.submitSetting.bind(this, setting, index)}>{(this.state.setting && this.state.setting.inputSubmit) ? this.state.setting.inputSubmit : 'Submit'}</button>
                    </div>
                  )
                })}
                <div className='settingBlock'>
                  <span>cover photo: &nbsp; </span> &nbsp;&nbsp;&nbsp;&nbsp;
                  <input onChange={this.handleCoverPhotoChange.bind(this)} type='file' />
                  <button type='button' className='btn btn-primary' onClick={this.submitCoverPhoto.bind(this)}>{(this.state.setting && this.state.setting.inputSubmit) ? this.state.setting.inputSubmit : 'Submit'}</button>
                </div>
                
                <div className='logoutBox'>
                  <Link to='/result'>{(this.state.setting && this.state.setting.ResultPage) ? this.state.setting.ResultPage : 'Result'}</Link>
                  &nbsp;
                  <button type='button' className='btn btn-primary' onClick={this.logout.bind(this)}>{(this.state.setting && this.state.setting.logout) ? this.state.setting.logout : 'logout'}</button>
                </div>
              </div>
              ) : (
              <div className='inputA'>
                <h3>{(this.state.setting && this.state.setting.AdminLogin) ? this.state.setting.AdminLogin : 'Admin login'}</h3>
                    <div className='card inputBoxA'>
                      <div>
                        <input onChange={this.handleAdminUsername.bind(this)} placeholder={(this.state.setting && this.state.setting.AdminUsername) ? this.state.setting.AdminUsername : 'Admin username'} className={this.state.adminUsername.length === 0 ? 'form-control is-invalid' : 'form-control'} />
                      </div>
                      <br />
                      <div>
                        <input onChange={this.handleAdminPassword.bind(this)} placeholder={(this.state.setting && this.state.setting.AdminPassword) ? this.state.setting.AdminPassword : 'Admin password'} className={this.state.adminPassword.length === 0 ? 'form-control is-invalid' : 'form-control'}  />
                      </div>
                      <br />              
                    </div>

                <div className='buttons'>
                  <button type='button' className='btn btn-primary' onClick={this.login.bind(this)}>{(this.state.setting && this.state.setting.inputSubmit) ? this.state.setting.inputSubmit : 'Submit'}</button>
                </div>
                <div className='buttons'>
                  <Link to='/publicresult'>{(this.state.setting && this.state.setting.ResultPage) ? this.state.setting.ResultPage : 'Result'} *</Link>
                  &nbsp;&nbsp;&nbsp;
                  <Link to='/result'>{(this.state.setting && this.state.setting.ResultPage) ? this.state.setting.ResultPage : 'Result'}</Link>
                  &nbsp;&nbsp;&nbsp;
                  <Link to='/inputa'>{(this.state.setting && this.state.setting.inputATitle) ? this.state.setting.inputATitle : 'Input A'}</Link>
                  &nbsp;&nbsp;&nbsp;
                  <Link to='/inputB'>{(this.state.setting && this.state.setting.inputBTitle) ? this.state.setting.inputBTitle : 'Input B'}</Link>

                </div>
                <div className='adminLinkBox'>
                  <Link to='/admin'>{(this.state.setting && this.state.setting.AdminLogin) ? this.state.setting.AdminLogin : 'Admin login'}</Link>
                </div>
              </div>
            )}
              </div>
          )}/>

        </Switch>
        
      </div>
    );
  }
}

export default App;
