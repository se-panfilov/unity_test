/*
* Implement a function that returns the summary of the current user's latest conversations,
* sorted by the latest message's timestamp (most recent conversation first).
*
* Make sure to have good unit tests in addition to the provided integration test!
*
* You have the following REST API available (base URL provided as a constant):
*
* Get current user's conversations: GET /conversations
* Get messages in a conversation: GET /conversations/:conversation_id/messages
* Get user by ID: GET /users/:user_id
*
* The result should be an array of objects of the following shape/type:
* {
*   id : string;
*   latest_message: {
*     body : string;
*     from_user : {
*       id: string;
*       avatar_url: string;
*     };
*     created_at : ISOString;
*   };
* }
*
*/

// TODO (S.Panfilov)
let fetch = require('node-fetch')

const API_BASE_URL = 'http://ui-developer-backend.herokuapp.com/api'

const ERRORS = {
  badRequest: 400,
  notFound: 404,
  methodNotAllowed: 405,
  internalServerError: 500,
  serviceUnavailable: 503
}

// I need to wrap all the functions just for test purpose, cause can't use sinon.mock() otherwise
const ConversationSummaries = {

  showError (message) {
    console.error(message)
  },

  onError (response) {
    switch (response.status) {
      case ERRORS.badRequest:
        return this.showError('Bad request')
      case ERRORS.notFound:
        return this.showError('Not found')
      case ERRORS.methodNotAllowed:
        return this.showError('Method not allowed')
      case ERRORS.internalServerError:
        return this.showError('Internal server error')
      case ERRORS.serviceUnavailable:
        return this.showError('Service unavailable')
      default:
        return this.showError('Unknown error')
    }
  },

  async getData (url, options) {
    if (!url) throw new Error('Url should be provided')

    return fetch(`${API_BASE_URL}/${url}`, options).then(response => {
      if (!response.ok) return this.onError(response)

      return response.json()
    })
  },

  async getConversations () {
    return this.getData('conversations')
  },

  async getMessages (id) {
    if (!Number.isFinite(+id)) throw new Error('Invalid id provided')

    return this.getData(`/conversations/${id}/messages`)
  },

  async getUser (id) {
    if (!Number.isFinite(+id)) throw new Error('Invalid id provided')

    return this.getData(`/users/${id}`)
  },

  async getMessagesForConversations (conversations) {
    if (!Array.isArray(conversations)) throw new Error('Conversations should be an array')

    return Promise.all(conversations.map(async (v) => ({
      id: v.id,
      messages: await this.getMessages(v.id)
    })))
  },

  getLatestMessages (messages) {
    return messages.map(v => ({id: v.id, latest_message: v.messages[0]}))
  },

  async mapResult (messages) {
    return Promise.all(messages.map(async (v) => {
      const {id, avatar_url} = await this.getUser(v.latest_message.from_user_id)

      return {
        id: v.id,
        latest_message: {
          id: v.latest_message.id,
          body: v.latest_message.body,
          created_at: v.latest_message.created_at,
          from_user: {id, avatar_url}
        }
      }
    }))
  },

  async getRecentConversationSummaries () {
    const conversations = await this.getConversations()
    const messages = await this.getMessagesForConversations(conversations)
    const latestMessages = this.getLatestMessages(messages)

    return this.mapResult(latestMessages)
  }
}

// TODO (S.Panfilov)
const mocha = require('mocha')
const sinon = require('sinon')
const expect = require('chai').expect

// Configure Mocha, telling both it and chai to use BDD-style tests.
// mocha.setup('bdd')
// const expect = chai.expect
// chai.should()

// Integration test
describe('getRecentConversationSummaries()', () => {
  it('should return the current user\'s latest conversations sorted by latest message\'s timestamp', async () => {
    const result = await ConversationSummaries.getRecentConversationSummaries()

    // TODO (S.Panfilov)
    // result.should.deep.equal([
    expect(result).to.be.deep.equal([
      {
        id: '1',
        latest_message: {
          id: '1',
          body: 'Moi!',
          from_user: {
            id: '1',
            avatar_url: 'http://placekitten.com/g/300/300'
          },
          created_at: '2016-08-25T10:15:00.670Z'
        }
      },
      {
        id: '2',
        latest_message: {
          id: '2',
          body: 'Hello!',
          from_user: {
            id: '3',
            avatar_url: 'http://placekitten.com/g/302/302'
          },
          created_at: '2016-08-24T10:15:00.670Z'
        }
      },
      {
        id: '3',
        latest_message: {
          id: '3',
          body: 'Hi!',
          from_user: {
            id: '1',
            avatar_url: 'http://placekitten.com/g/300/300'
          },
          created_at: '2016-08-23T10:15:00.670Z'
        }
      },
      {
        id: '4',
        latest_message: {
          id: '4',
          body: 'Morning!',
          from_user: {
            id: '5',
            avatar_url: 'http://placekitten.com/g/304/304'
          },
          created_at: '2016-08-22T10:15:00.670Z'
        }
      },
      {
        id: '5',
        latest_message: {
          id: '5',
          body: 'Pleep!',
          from_user: {
            id: '6',
            avatar_url: 'http://placekitten.com/g/305/305'
          },
          created_at: '2016-08-21T10:15:00.670Z'
        }
      }
    ])
  })

  // TODO: Add more tests
})

// Unit tests
describe('Unit tests', () => {

  describe('showError', () => {
    it('should return error to the console', () => {
      let isConsoleFired = false

      console.error = function () {
        isConsoleFired = true
      }

      expect(isConsoleFired).to.be.false
      ConversationSummaries.showError()
      expect(isConsoleFired).to.be.true
    })
  })

  describe('onError', () => {

    it('should return badRequest message', () => {
      const mock = sinon.mock(ConversationSummaries)
      const response = {
        status: ERRORS.badRequest
      }

      const expectedResult = 'Bad request'

      mock.expects('showError').withExactArgs(expectedResult).once()

      ConversationSummaries.onError(response)

      mock.verify()
      mock.restore()
    })

    it('should return notFound message', () => {
      const mock = sinon.mock(ConversationSummaries)
      const response = {
        status: ERRORS.notFound
      }

      const expectedResult = 'Not found'

      mock.expects('showError').withExactArgs(expectedResult).once()

      ConversationSummaries.onError(response)

      mock.verify()
      mock.restore()
    })

    it('should return methodNotAllowed message', () => {
      const mock = sinon.mock(ConversationSummaries)
      const response = {
        status: ERRORS.methodNotAllowed
      }

      const expectedResult = 'Method not allowed'

      mock.expects('showError').withExactArgs(expectedResult).once()

      ConversationSummaries.onError(response)

      mock.verify()
      mock.restore()
    })

    it('should return internalServerError message', () => {
      const mock = sinon.mock(ConversationSummaries)
      const response = {
        status: ERRORS.internalServerError
      }

      const expectedResult = 'Internal server error'

      mock.expects('showError').withExactArgs(expectedResult).once()

      ConversationSummaries.onError(response)

      mock.verify()
      mock.restore()
    })

    it('should return serviceUnavailable message', () => {
      const mock = sinon.mock(ConversationSummaries)
      const response = {
        status: ERRORS.serviceUnavailable
      }

      const expectedResult = 'Service unavailable'

      mock.expects('showError').withExactArgs(expectedResult).once()

      ConversationSummaries.onError(response)

      mock.verify()
      mock.restore()
    })

    it('should return unknown error message', () => {
      const mock = sinon.mock(ConversationSummaries)
      const response = {
        status: 666
      }

      const expectedResult = 'Unknown error'

      mock.expects('showError').withExactArgs(expectedResult).once()

      ConversationSummaries.onError(response)

      mock.verify()
      mock.restore()
    })

  })

  describe('getData', () => {

    it('should throw an error when no url provided', async () => {
      try {
        await ConversationSummaries.getData()
      } catch (err) {
        expect(err.message).to.be.equal('Url should be provided')
      }
    })

    it('should call fetch with provided args', async () => {
      const url = 'some.com'
      const options = {some: 'some'}

      //dirty hack to mock fetch toth for nodejs and browser
      let calledUrl = ''
      let calledOptions = ''
      fetch = async function (url, options) {
        calledUrl = url
        calledOptions = options

        return {
          ok: true, json () {
          }
        }
      }

      const expectedUrl = `${API_BASE_URL}/${url}`

      await ConversationSummaries.getData(url, options)

      expect(calledUrl).to.be.equal(expectedUrl)
      expect(calledOptions).to.be.deep.equal(options)
    })

    it('should call onError in case of bad response', async () => {
      const mock = sinon.mock(ConversationSummaries)

      //dirty hack to mock fetch toth for nodejs and browser
      fetch = async function (url, options) {
        return {
          ok: false, json () {
          }
        }
      }

      mock.expects('onError').withArgs({json: sinon.match.func, ok: false}).once()

      await ConversationSummaries.getData('some')

      mock.verify()
      mock.restore()
    })

  })

  describe('getConversations', () => {
    it('QQQQ', async () => {

    })
  })

  describe('getMessages', () => {
    it('QQQQ', async () => {

    })
  })

  describe('getUser', () => {
    it('QQQQ', async () => {

    })
  })

  describe('getMessagesForConversations', () => {
    it('QQQQ', async () => {

    })
  })

  describe('getLatestMessages', () => {
    it('QQQQ', () => {

    })
  })

  describe('mapResult', () => {
    it('QQQQ', async () => {

    })
  })

  describe('getRecentConversationSummaries', () => {
    it('QQQQ', async () => {

    })
  })

  // TODO: Add more tests
})

// TODO (S.Panfilov)
// Run all our test suites.  Only necessary in the browser.
// mocha.run()
