import {expect} from "chai"

import {PromiseWritable} from "../src/promise-writable.js"

import {And, Feature, Given, Scenario, Then, When} from "./lib/steps.js"

import {MockStreamWritable} from "./lib/mock-stream-writable.js"

Feature("Test promise-writable module for end method", () => {
  Scenario("End the stream", () => {
    let ended = false
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When("I call end method", () => {
      promiseWritable.end().then(() => {
        ended = true
      })
    })

    And("finish event is emitted", () => {
      stream.emit("finish")
    })

    Then("promise is fulfilled", () => {
      expect(ended).to.be.true
    })
  })

  Scenario("End the closed stream", () => {
    let ended = false
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When("I call end method", () => {
      promiseWritable.end()
    })

    And("stream is closed", () => {
      stream.close()
    })

    And("I call end method", () => {
      promiseWritable.end().then(() => {
        ended = true
      })
    })

    Then("promise is fulfilled", () => {
      expect(ended).to.be.true
    })
  })

  Scenario("End the stream with error", () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    When("I call end method", () => {
      promiseWritable.end().catch(err => {
        error = err
      })
    })

    And("error event is emitted", () => {
      stream.emit("error", new Error("boom"))
    })

    Then("promise is rejected", () => {
      expect(error).to.be.an("error").with.property("message", "boom")
    })
  })

  Scenario("End the stream with emitted error", () => {
    let error: Error
    let promiseWritable: PromiseWritable<MockStreamWritable>
    let stream: MockStreamWritable

    Given("Writable object", () => {
      stream = new MockStreamWritable()
    })

    And("PromiseWritable object", () => {
      promiseWritable = new PromiseWritable(stream)
    })

    And("error event is emitted", () => {
      stream.emit("error", new Error("boom"))
    })

    When("I call end method", () => {
      promiseWritable.end().catch(err => {
        error = err
      })
    })

    Then("promise is rejected", () => {
      expect(error).to.be.an("error").with.property("message", "boom")
    })
  })
})
