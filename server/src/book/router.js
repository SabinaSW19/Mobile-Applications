import Router from 'koa-router';
import bookStore from './store';
import { broadcast } from "../utils";

export const router = new Router();

router.get('/', async (ctx) => {
  const response = ctx.response;
  const userId = ctx.state.user._id;
  response.body = await bookStore.find({ userId });
  response.status = 200; // ok
});

router.get('/:id', async (ctx) => {
  const userId = ctx.state.user._id;
  const book = await bookStore.findOne({ _id: ctx.params.id });
  const response = ctx.response;
  if (book) {
    if (book.userId === userId) {
      response.body = book;
      response.status = 200; // ok
    } else {
      response.status = 403; // forbidden
    }
  } else {
    response.status = 404; // not found
  }
});

const createBook = async (ctx, book, response) => {
  console.log(book);
  try {
    const userId = ctx.state.user._id;
    book.userId = userId;
    response.body = await bookStore.insert(book);
    response.status = 201; // created
    broadcast(userId, { type: 'created', payload: book });
  } catch (err) {
    response.body = { message: err.message };
    response.status = 400; // bad request
  }
};

router.post('/', async ctx => await createBook(ctx, ctx.request.body, ctx.response));

router.put('/:id', async (ctx) => {
  const book = ctx.request.body;
  const id = ctx.params.id;
  const bookId = book._id;
  const response = ctx.response;
  if (bookId && bookId !== id) {
    response.body = { message: 'Param id and body _id should be the same' };
    response.status = 400; // bad request
    return;
  }
  if (!bookId) {
    await createBook(ctx, book, response);
  } else {
    const userId = ctx.state.user._id;
    book.userId = userId;
    const updatedCount = await bookStore.update({ _id: id }, book);
    if (updatedCount === 1) {
      response.body = book;
      response.status = 200; // ok
      broadcast(userId, { type: 'updated', payload: book });
    } else {
      response.body = { message: 'Resource no longer exists' };
      response.status = 405; // method not allowed
    }
  }
});

router.del('/:id', async (ctx) => {
  const userId = ctx.state.user._id;
  const book = await bookStore.findOne({ _id: ctx.params.id });
  if (book && userId !== book.userId) {
    ctx.response.status = 403; // forbidden
  } else {
    await bookStore.remove({ _id: ctx.params.id });
    ctx.response.status = 204; // no content
  }
});
