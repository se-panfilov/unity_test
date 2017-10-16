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
    if (!Array.isArray(messages)) throw new Error('messages should be an array')

    return messages.map(v => ({id: v.id, latest_message: v.messages[0]}))
  },

  async mapResult (messages) {
    if (!Array.isArray(messages)) throw new Error('messages should be an array')

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

  getTimeStamp (str) {
    if (typeof str !== 'string') throw new Error('argument should be a string')
    const date = new Date(str)
    if (date instanceof Date && isNaN(date.valueOf())) throw new Error('invalid string provided')

    return date.getTime()
  },

  async getRecentConversationSummaries () {
    const conversations = await this.getConversations()
    const messages = await this.getMessagesForConversations(conversations)
    const latestMessages = this.getLatestMessages(messages)
    const result = await this.mapResult(latestMessages)

    return result.sort((a, b) => new Date(this.getTimeStamp(b.latest_message.created_at) - this.getTimeStamp(a.latest_message.created_at)))
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
describe('Unit tests.', () => {

  async function getAsyncErrorMessage (method, ...rest) {
    try {
      await ConversationSummaries[method](...rest)
    } catch (err) {
      return err.message
    }

    throw new Error('Method didn\'t fires any errors')
  }

  describe('showError.', () => {
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

  describe('onError.', () => {

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

  describe('getData.', () => {

    it('should throw an error when no url provided', async () => {
      const message3 = await getAsyncErrorMessage('getData')
      expect(message3).to.be.equal('Url should be provided')
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

  describe('getConversations.', () => {

    it('should call getData with proper args', async () => {
      const mock = sinon.mock(ConversationSummaries)
      const expectedResult = [1, 2, 3]
      const endpointUrl = 'conversations'

      mock.expects('getData').withExactArgs(endpointUrl).returns(expectedResult).once()

      const result = await ConversationSummaries.getConversations()

      expect(result).to.be.deep.equal(expectedResult)

      mock.verify()
      mock.restore()
    })

  })

  describe('getMessages.', () => {

    it('should throw an error without id provided', async () => {
      const message3 = await getAsyncErrorMessage('getMessages')
      expect(message3).to.be.equal('Invalid id provided')
    })

    it('should throw an error with invalid id provided', async () => {
      const message3 = await getAsyncErrorMessage('getMessages', 'asdsad')
      expect(message3).to.be.equal('Invalid id provided')
    })

    it('should call getData with proper args', async () => {
      const mock = sinon.mock(ConversationSummaries)
      const expectedResult = [1, 2, 3]
      const id = 100
      const endpointUrl = `/conversations/${id}/messages`

      mock.expects('getData').withExactArgs(endpointUrl).returns(expectedResult).once()

      const result = await ConversationSummaries.getMessages(id)

      expect(result).to.be.deep.equal(expectedResult)

      mock.verify()
      mock.restore()
    })

  })

  describe('getUser.', () => {

    it('should throw an error without id provided', async () => {
      const message3 = await getAsyncErrorMessage('getUser')
      expect(message3).to.be.equal('Invalid id provided')
    })

    it('should throw an error with invalid id provided', async () => {
      const message3 = await getAsyncErrorMessage('getUser', 'asdasds')
      expect(message3).to.be.equal('Invalid id provided')
    })

    it('should call getData with proper args', async () => {
      const mock = sinon.mock(ConversationSummaries)
      const expectedResult = [1, 2, 3]
      const id = 100
      const endpointUrl = `/users/${id}`

      mock.expects('getData').withExactArgs(endpointUrl).returns(expectedResult).once()

      const result = await ConversationSummaries.getUser(id)

      expect(result).to.be.deep.equal(expectedResult)

      mock.verify()
      mock.restore()
    })

  })

  describe('getMessagesForConversations', () => {

    it('should throw an error without id provided', async () => {
      const message1 = await getAsyncErrorMessage('getMessagesForConversations')
      expect(message1).to.be.equal('Conversations should be an array')

      const message2 = await getAsyncErrorMessage('getMessagesForConversations', {})
      expect(message2).to.be.equal('Conversations should be an array')

      const message3 = await getAsyncErrorMessage('getMessagesForConversations', 123)
      expect(message3).to.be.equal('Conversations should be an array')

      const message4 = await getAsyncErrorMessage('getMessagesForConversations', '')
      expect(message4).to.be.equal('Conversations should be an array')
    })

    it('should call getMessages for each conversation provided', async () => {
      const mock = sinon.mock(ConversationSummaries)
      const obj1 = {id: 1}
      const obj2 = {id: 2}
      const conversations = [obj1, obj2]

      const expectedMessages1 = [{id: 3}]
      mock.expects('getMessages').withExactArgs(obj1.id).returns(expectedMessages1).once()

      const expectedMessages2 = [{id: 4}]
      mock.expects('getMessages').withExactArgs(obj2.id).returns(expectedMessages2).once()

      const expectedResult = [
        {id: obj1.id, messages: expectedMessages1},
        {id: obj2.id, messages: expectedMessages2}
      ]
      const result = await ConversationSummaries.getMessagesForConversations(conversations)

      expect(result).to.be.deep.equal(expectedResult)

      mock.verify()
      mock.restore()
    })

  })

  describe('getLatestMessages.', () => {

    it('should throw an error when messages isn\'t an array', () => {
      const expectedMessage = 'messages should be an array'

      expect(() => ConversationSummaries.getLatestMessages('')).to.throw(expectedMessage)
      expect(() => ConversationSummaries.getLatestMessages(123)).to.throw(expectedMessage)
      expect(() => ConversationSummaries.getLatestMessages(null)).to.throw(expectedMessage)
      expect(() => ConversationSummaries.getLatestMessages({})).to.throw(expectedMessage)
      expect(() => ConversationSummaries.getLatestMessages()).to.throw(expectedMessage)
    })

    it('should return proper object ', () => {

      const messages = [
        {
          id: 1,
          messages: [
            {some: 'some1'},
            {some: 'other1'}
          ]
        },
        {
          id: 2,
          messages: [
            {some: 'some2'},
            {some: 'other2'}
          ]
        }
      ]

      const expectedResult = [
        {id: messages[0].id, latest_message: messages[0].messages[0]},
        {id: messages[1].id, latest_message: messages[1].messages[0]},
      ]

      const result = ConversationSummaries.getLatestMessages(messages)

      expect(result).to.be.deep.equal(expectedResult)
    })

  })

  describe('mapResult.', () => {

    it('should throw an error when messages isn\'t an array', async () => {
      const expectedMessage = 'messages should be an array'

      const message1 = await getAsyncErrorMessage('mapResult')
      expect(message1).to.be.equal(expectedMessage)

      const message2 = await getAsyncErrorMessage('mapResult', '')
      expect(message2).to.be.equal(expectedMessage)

      const message3 = await getAsyncErrorMessage('mapResult', 123)
      expect(message3).to.be.equal(expectedMessage)

      const message4 = await getAsyncErrorMessage('mapResult', null)
      expect(message4).to.be.equal(expectedMessage)

      const message5 = await getAsyncErrorMessage('mapResult', {})
      expect(message5).to.be.equal(expectedMessage)
    })

    it('should map results in a proper structure', async () => {
      const mock = sinon.mock(ConversationSummaries)

      const user1 = {
        id: 3,
        avatar_url: 'some.com/123',
        some_extra_field: 'remove_me1'
      }

      const user2 = {
        id: 6,
        avatar_url: 'some.com/456',
        some_extra_field: 'remove_me2'
      }

      const data = [
        {id: 1, latest_message: {id: 2, body: 'some1', created_at: new Date(), from_user_id: user1.id}},
        {id: 4, latest_message: {id: 5, body: 'some2', created_at: new Date(), from_user_id: user2.id}}
      ]

      mock.expects('getUser').withExactArgs(user1.id).returns(user1).once()
      mock.expects('getUser').withExactArgs(user2.id).returns(user2).once()

      const expectedResult = [
        {
          id: data[0].id,
          latest_message: {
            id: data[0].latest_message.id,
            body: data[0].latest_message.body,
            created_at: data[0].latest_message.created_at,
            from_user: {
              id: user1.id,
              avatar_url: user1.avatar_url
            }
          }
        },
        {
          id: data[1].id,
          latest_message: {
            id: data[1].latest_message.id,
            body: data[1].latest_message.body,
            created_at: data[1].latest_message.created_at,
            from_user: {
              id: user2.id,
              avatar_url: user2.avatar_url
            }
          }
        }
      ]

      const result = await ConversationSummaries.mapResult(data)

      expect(result).to.be.deep.equal(expectedResult)

      mock.verify()
      mock.restore()
    })
  })

  describe('getTimeStamp.', () => {

    it('should throw an error when argument isn\'t a string', () => {
      const expectedMessage = 'argument should be a string'

      expect(() => ConversationSummaries.getTimeStamp(123123213)).to.throw(expectedMessage)
      expect(() => ConversationSummaries.getTimeStamp(new Date)).to.throw(expectedMessage)
      expect(() => ConversationSummaries.getTimeStamp({})).to.throw(expectedMessage)
      expect(() => ConversationSummaries.getTimeStamp([])).to.throw(expectedMessage)
      expect(() => ConversationSummaries.getTimeStamp()).to.throw(expectedMessage)
      expect(() => ConversationSummaries.getTimeStamp(null)).to.throw(expectedMessage)
    })

    it('should throw an error when argument isn\'t convertable to date', () => {
      const expectedMessage = 'invalid string provided'

      expect(() => ConversationSummaries.getTimeStamp('')).to.throw(expectedMessage)
      expect(() => ConversationSummaries.getTimeStamp('hello')).to.throw(expectedMessage)
    })

    it('should return proper timestamp', () => {
      const str = '2016-08-25T10:15:00.670Z'

      const expectedResult = new Date(str).getTime()

      const result = ConversationSummaries.getTimeStamp(str)

      expect(result).to.be.equal(expectedResult)

    })
  })

  describe('getRecentConversationSummaries.', () => {

    it('shpould call methods with proper args', async () => {
      const mock = sinon.mock(ConversationSummaries)

      const expectedConversations = [1]
      const expectedMessages = [2]
      const expectedLatestMessage = [3]
      const expectedResult = [4]
      mock.expects('getConversations').withExactArgs().returns(expectedConversations).once()
      mock.expects('getMessagesForConversations').withExactArgs(expectedConversations).returns(expectedMessages).once()
      mock.expects('getLatestMessages').withExactArgs(expectedMessages).returns(expectedLatestMessage).once()
      mock.expects('mapResult').withExactArgs(expectedLatestMessage).returns(expectedResult).once()

      const result = await ConversationSummaries.getRecentConversationSummaries()

      expect(result).to.be.deep.equal(expectedResult)

      mock.verify()
      mock.restore()
    })

  })

  // TODO: Add more tests
})

// TODO (S.Panfilov)
// Run all our test suites.  Only necessary in the browser.
// mocha.run()
