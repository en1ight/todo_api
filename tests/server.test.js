"use strict";
const assert = require('expect');
const request = require('supertest');
const {ObjectId} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const todos = [{
  _id: new ObjectId(),
  text: 'Some text 1'
}, {
  _id: new ObjectId(),
  text: 'Some text 2'
}];

// remove all Todos before testing, because we will expect length == 1
// of this collection below in tests
beforeEach((done) => {
  Todo.remove({}).then(()=> {
    return Todo.insertMany(todos);
  }).then(() => done());
});

// Testing post
describe('POST /todos', () => {

  it('should create a new todo', (done) => {
    // this text will be requested to the server
    var text = 'Test todo text';

    request(app)
      .post('/todos') // request to /todos
      .send({text}) // requesting text
      .expect(200) // expecting that server is running
      .expect((res) => {
        // expecting that response will be the same text as above
        assert(res.body.text).toBe(text)
      })
      .end((err, res) => {
        if(err) {
          return done(err)
        }

        // if no errors, get all todos from DB, expect there will be only 1 document and it will contain text
        Todo.find({text}).then((todos) => {
          assert(todos.length).toBe(1);
          assert(todos[0].text).toBe(text);
          done();
        }).catch((e) => done(e)); // or throw error
      });
  });

  it('Should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos') // request to /todos
      .send({}) // requesting empty body
      .expect(400) // expecting that server is running
      .end((err, res) => {
        if(err) {
          return done(err)
        }

        // if no errors, get all todos from DB, expect there will be only 1 document and it will contain text
        Todo.find().then((todos) => {
          assert(todos.length).toBe(2);
          done();
        }).catch((e) => done(e)); // or throw error
      });
  })
});


describe('GET /todos', () => {

  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        assert(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`) // will be string like '58e20895f15ade11609642b4'
      .expect(200)
      .expect((res) => {
        assert(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should return 404 if todo not found', (done) => {
    let hexId = new ObjectId().toHexString();
    request(app)
      .get(`/todos/${hexId}`) // will be string like '58e20895f15ade11609642b4'
      .expect(404)
      .end(done);
  });

  it('should return 404 for non-object ids', (done) => {
    request(app)
      .get(`/todos/123`)
      .expect(404)
      .end(done);
  });
});