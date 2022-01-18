package com.ma.androidlab.book.data


import android.util.Log
import androidx.lifecycle.LiveData
import com.ma.androidlab.book.data.local.BookDao
import com.ma.androidlab.book.data.remote.BookApi
import com.ma.androidlab.core.Result
import com.ma.androidlab.core.TAG
import androidx.work.*


class BookRepository(private val bookDao: BookDao) {

    val books = bookDao.getAll();


    suspend fun refresh(): Result<Boolean> {
        try{
            val books = BookApi.service.find()
            for(book in books){
                bookDao.insert(book)
            }
            return Result.Success(true)
        } catch (e: java.lang.Exception){
            return Result.Error(e)
        }
    }


    fun getById(bookId: String): LiveData<Book> {
        return bookDao.getById(bookId)
    }


    suspend fun save(book: Book): Result<Book> {
        try {
            Log.v(TAG, "save - started")
            val createdBook = BookApi.service.create(book)
            bookDao.insert(createdBook)
            Log.v(TAG, "save - succeeded")
            return Result.Success(createdBook)
        } catch (e: Exception) {
            Log.w(TAG, "save - failed", e)

            bookDao.insert(book)

            createWorker(book, "save")
            return Result.Error(e)
        }
    }

    suspend fun update(book: Book): Result<Book> {
        try {
            Log.v(TAG, "update - started")
            val updatedBook = BookApi.service.update(book._id, book)
            bookDao.update(updatedBook)
            Log.v(TAG, "update - succeeded")
            return Result.Success(updatedBook)
        } catch (e: Exception) {
            Log.v(TAG, "update - failed")
            bookDao.update(book)
            createWorker(book, "update")
            return Result.Error(e)
        }
    }

    fun createWorker(book: Book, operation: String){
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val inputData = Data.Builder()
            .putString("operation", "save")
            .putString("id", book._id)
            .putString("title", book.title)
            .putString("author", book.author)
            .putInt("price", book.price)
            .putBoolean("isAvailable", book.isAvailable)
            .putInt("dateDay", book.dateOfPublication.day)
            .putInt("dateMonth", book.dateOfPublication.month)
            .putInt("dateYear", book.dateOfPublication.year)
            .build()

        val myWork = OneTimeWorkRequest.Builder(SyncWorker::class.java)
            .setConstraints(constraints)
            .setInputData(inputData)
            .build()

        WorkManager.getInstance().enqueue(myWork);
    }

}