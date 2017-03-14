'use strict'

/* global Feature, Scenario, Given, When, Then */
const t = require('tap')
require('tap-given')(t)

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)
chai.should()

Feature('Test promise-writable module', () => {
  const PromiseWritable = require('../lib/promise-writable')
  const EventEmitter = require('events')

  class MockStream extends EventEmitter {
    constructor () {
      super()
      this.writable = true
      this._buffer = new Buffer(0)
    }
    write (chunk) {
      this._buffer = Buffer.concat([this._buffer, chunk])
      return !chunk.toString().startsWith('pause')
    }
    end () { }
  }

  Scenario('Write chunks to stream which doesn not pause', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call write method', () => {
      this.promise = this.promiseWritable.write(new Buffer('chunk1'))
    })

    Then('promise is fulfilled', () => {
      return this.promise.should.be.fulfilled.and.ok
    })

    Then('stream should contain this chunk', () => {
      this.stream._buffer.should.deep.equal(new Buffer('chunk1'))
    })

    When('I call write method again', () => {
      this.promise = this.promiseWritable.write(new Buffer('chunk2'))
    })

    Then('promise is fulfilled', () => {
      return this.promise.should.be.fulfilled.and.ok
    })

    Then('stream should contain another chunk', () => {
      this.stream._buffer.should.deep.equal(new Buffer('chunk1chunk2'))
    })
  })

  Scenario('Write chunks to stream which pauses', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call write method which pauses stream', () => {
      this.promise = this.promiseWritable.write(new Buffer('pause1'))
    })

    When('drain event is emitted', () => {
      this.stream.emit('drain')
    })

    Then('promise is fulfilled', () => {
      return this.promise.should.be.fulfilled.and.ok
    })

    Then('stream should contain this chunk', () => {
      this.stream._buffer.should.deep.equal(new Buffer('pause1'))
    })

    When('I call write method again', () => {
      this.promise = this.promiseWritable.write(new Buffer('pause2'))
    })

    When('finish event is emitted', () => {
      this.stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return this.promise.should.be.fulfilled.and.ok
    })

    Then('stream should contain another chunk', () => {
      this.stream._buffer.should.deep.equal(new Buffer('pause1pause2'))
    })
  })

  Scenario('Write chunk to already finished stream', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call write method', () => {
      this.promiseWritable.write(new Buffer('pause1'))
    })

    When('finish event is emitted', () => {
      this.stream.emit('finish')
    })

    When('I call write method again', () => {
      this.promise = this.promiseWritable.write(new Buffer('pause2'))
    })

    When('error event is emitted', () => {
      this.stream.emit('error', new Error('write after end'))
    })

    Then('promise is rejected', () => {
      return this.promise.should.be.rejectedWith(Error, 'write after end')
    })
  })

  Scenario('Write chunk to stream with error', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call write method which pauses stream', () => {
      this.promise = this.promiseWritable.write(new Buffer('pause1'))
    })

    When('error event is emitted', () => {
      this.stream.emit('error', new Error('boom'))
    })

    Then('promise is rejected', () => {
      return this.promise.should.be.rejectedWith(Error, 'boom')
    })
  })

  Scenario('Write all in one chunk', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call writeAll method', () => {
      this.promise = this.promiseWritable.writeAll(new Buffer('chunk1chunk2chunk3'))
    })

    When('finish event is emitted', () => {
      this.stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return this.promise.should.be.fulfilled.and.ok
    })

    Then('stream should contain this chunk', () => {
      this.stream._buffer.should.deep.equal(new Buffer('chunk1chunk2chunk3'))
    })
  })

  Scenario('Write all chunk by chunk in non paused mode', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call writeAll method', () => {
      this.promise = this.promiseWritable.writeAll(new Buffer('chunk1chunk2chunk3'), 6)
    })

    When('finish event is emitted', () => {
      this.stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return this.promise.should.be.fulfilled.and.ok
    })

    Then('stream should contain this chunk', () => {
      this.stream._buffer.should.deep.equal(new Buffer('chunk1chunk2chunk3'))
    })
  })

  Scenario('Write all chunk by chunk in paused mode', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call writeAll method which pauses stream', () => {
      this.promise = this.promiseWritable.writeAll(new Buffer('pause1pause2pause3'), 6)
    })

    for (let i = 1; i <= 3; i++) {
      When('drain event is emitted', () => {
        this.stream.emit('drain')
      })
    }

    When('finish event is emitted', () => {
      this.stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return this.promise.should.be.fulfilled.and.ok
    })

    Then('stream should contain this chunk', () => {
      this.stream._buffer.should.deep.equal(new Buffer('pause1pause2pause3'))
    })
  })

  Scenario('Write all to finished stream', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call end method', () => {
      this.promiseWritable.end()
    })

    When('finish event is emitted', () => {
      this.stream.emit('finish')
    })

    When('I call writeAll method', () => {
      this.promise = this.promiseWritable.writeAll(new Buffer('pause1pause2pause3'))
    })

    Then('promise is rejected', () => {
      return this.promise.should.be.rejectedWith(Error, 'writeAll after end')
    })
  })

  Scenario('Write all to stream with error', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call writeAll method which pauses stream', () => {
      this.promise = this.promiseWritable.writeAll(new Buffer('pause1pause2pause3'))
    })

    When('error event is emitted', () => {
      this.stream.emit('error', new Error('boom'))
    })

    Then('promise is rejected', () => {
      return this.promise.should.be.rejectedWith(Error, 'boom')
    })
  })

  for (const event of ['open', 'close', 'pipe', 'unpipe', 'finish']) {
    Scenario(`Wait for ${event} from stream`, function () {
      Given('Writable object', () => {
        this.stream = new MockStream()
      })

      Given('PromiseWritable object', () => {
        this.promiseWritable = new PromiseWritable(this.stream)
      })

      When(`I call ${event} method`, () => {
        this.promise = this.promiseWritable.once(event)
      })

      When(`${event} event is emitted`, () => {
        this.stream.emit(event, 'result')
      })

      if (event !== 'finish') {
        Then('promise is fulfilled', () => {
          return this.promise.should.eventually.equal('result')
        })
      } else {
        Then('promise returns null', () => {
          return this.promise.should.eventually.be.null
        })
      }
    })

    Scenario(`Wait for ${event} from finished stream`, function () {
      Given('Writable object', () => {
        this.stream = new MockStream()
      })

      Given('PromiseWritable object', () => {
        this.promiseWritable = new PromiseWritable(this.stream)
      })

      When(`I call ${event} method`, () => {
        this.promise = this.promiseWritable.once(event)
      })

      When('finish event is emitted', () => {
        this.stream.emit('finish')
      })

      Then('promise returns null', () => {
        return this.promise.should.eventually.be.null
      })

      When(`I call ${event} method`, () => {
        this.promise = this.promiseWritable.once(event)
      })

      if (event !== 'finish') {
        Then('promise is rejected', () => {
          return this.promise.should.be.rejectedWith(Error, `once ${event} after end`)
        })
      } else {
        Then('promise is fulfilled', () => {
          return this.promise.should.eventually.be.null
        })
      }
    })

    Scenario(`Wait for ${event} from stream with error`, function () {
      Given('Writable object', () => {
        this.stream = new MockStream()
      })

      Given('PromiseWritable object', () => {
        this.promiseWritable = new PromiseWritable(this.stream)
      })

      When(`I call ${event} method`, () => {
        this.promise = this.promiseWritable.once(event)
      })

      When('error event is emitted', () => {
        this.stream.emit('error', new Error('boom'))
      })

      Then('promise is rejected', () => {
        return this.promise.should.be.rejectedWith(Error, 'boom')
      })
    })
  }

  Scenario('End the stream', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call end method', () => {
      this.promise = this.promiseWritable.end()
    })

    When('finish event is emitted', () => {
      this.stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return this.promise.should.be.fulfilled.and.ok
    })
  })

  Scenario('End the ended stream', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call end method', () => {
      this.promiseWritable.end()
    })

    When('finish event is emitted', () => {
      this.stream.emit('finish')
    })

    When('I call end method', () => {
      this.promise = this.promiseWritable.end()
    })

    When('finish event is emitted', () => {
      this.stream.emit('finish')
    })

    Then('promise is fulfilled', () => {
      return this.promise.should.be.fulfilled.and.ok
    })

    When('I call end method', () => {
      this.promise = this.promiseWritable.end()
    })

    Then('promise is fulfilled', () => {
      return this.promise.should.be.fulfilled.and.ok
    })
  })

  Scenario('End the stream with error', function () {
    Given('Writable object', () => {
      this.stream = new MockStream()
    })

    Given('PromiseWritable object', () => {
      this.promiseWritable = new PromiseWritable(this.stream)
    })

    When('I call end method', () => {
      this.promise = this.promiseWritable.end()
    })

    When('error event is emitted', () => {
      this.stream.emit('error', new Error('boom'))
    })

    Then('promise is rejected', () => {
      return this.promise.should.be.rejectedWith(Error, 'boom')
    })
  })
})