import React, { Component } from 'react';
import {Modal,Effect,ModalManager} from 'react-dynamic-modal';
import Dropdown from 'react-dropdown'
import './dropdown.css'
import './react-datetime.css'
const toastr = require('toastr');
const Web3 = require('web3')
const web3 = new Web3(window.web3.currentProvider)

const tradeInfo = require('../truffle/build/contracts/Trade.json')
const cardInfo = require('../truffle/build/contracts/Card.json')
const TradeContract = web3.eth.contract(tradeInfo.abi);
const CardContract = web3.eth.contract(cardInfo.abi);

export default class AddItemDialog extends Component {

  constructor(props) {
    super(props);
    this.state = {
      card: null
    };
  }

  addItem() {
    const addItemDialog = this
    if (!this.state.card) {
      toastr.error("No card to add")
      return
    }

    const trade = TradeContract.at(this.props.tradeAddress)
    const cardAddress = this.props.cards.filter((card) => card.name==this.state.card)[0].address
    const card = CardContract.at(cardAddress)

    // transfer ownership
    card.transferOwnership(trade.address,  {from: addItemDialog.props.address, gas: 100000},
    function(error, transaction) {
    trade.addTradeItem(cardAddress,{from: addItemDialog.props.address, gas: 500000}, function(error, transaction) {
      card.id(function(error, id) {
      fetch('http://cryptomtg-server.herokuapp.com/trades/add/' + addItemDialog.props.tradeAddress, {
        method: 'PUT',
        body: JSON.stringify({card:id, party:addItemDialog.props.address}),
        headers: {
            "Content-Type": "application/json"
        }
      }).then(function(response) {

        if (response.status == 200) {
          response.json().then(function(data) {
            toastr.success("You have have added a " + addItemDialog.state.card + " to the trade.")
          })

          fetch('http://cryptomtg-server.herokuapp.com/cards/transfer/'+id, {
            method: 'PUT',
            body: JSON.stringify({address: addItemDialog.props.tradeAddress}),
            headers: {
                "Content-Type": "application/json"
            }
          }).then(function(response) {
            }
          ).catch(function(error) {
            console.log('There has been a problem with your fetch operation: ' + error.message);
          });

        }

      }).catch(function(error) {
        console.log('There has been a problem with your fetch operation: ' + error.message);
      });
    })
  })
  })
    ModalManager.close()
  }



  render(){
    return (
       <Modal style={{content: {textAlign: 'center', width: '40%', height: 200}}}
          onRequestClose={() => true}
          effect={Effect.ScaleUp}>
          <h4>Select Card:</h4>
          <Dropdown style={{width:100}} value={this.state.card} onChange={(option) => this.setState({card: option.label})} options={Array.from(new Set(this.props.cards.map((card) => card.name)))} placeholder="Select an option" />

          <button className='reject' onClick={ModalManager.close}>Cancel</button>
          <button className='accept' onClick={() => this.addItem()}>Add Item</button>
       </Modal>

    );
  }
}
