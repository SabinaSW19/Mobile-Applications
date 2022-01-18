package com.ma.androidlab.book.book

import android.app.Application
import android.util.Log
import androidx.lifecycle.*
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequest
import com.ma.androidlab.book.data.Book
import com.ma.androidlab.book.data.BookRepository
import com.ma.androidlab.book.data.SyncWorker
import com.ma.androidlab.book.data.local.BooksDatabase
import com.ma.androidlab.core.TAG
import kotlinx.coroutines.launch
import java.util.*
import com.ma.androidlab.core.Result

class BookEditViewModel(application: Application) : AndroidViewModel(application) {

    private val mutableBook = MutableLiveData<Book>().apply { value = Book("","", "", 0, Date(),false) }

    private val mutableFetching = MutableLiveData<Boolean>().apply { value = false }
    private val mutableCompleted = MutableLiveData<Boolean>().apply { value = false }
    private val mutableException = MutableLiveData<Exception>().apply { value = null }

    val book: LiveData<Book> = mutableBook

    val fetching: LiveData<Boolean> = mutableFetching
    val fetchingError: LiveData<Exception> = mutableException
    val completed: LiveData<Boolean> = mutableCompleted

    val bookRepository: BookRepository
    init {
        val bookDao = BooksDatabase.getDatabase(application, viewModelScope).bookDao()
        bookRepository = BookRepository(bookDao)
    }

    private val TAG_OUTPUT = "OUTPUT"
    //private val workManager = WorkManager.getInstance(application)


    fun getBookById(bookId: String): LiveData<Book> {
        Log.v(TAG, "getBookById...")
        return bookRepository.getById(bookId)
    }

    fun saveOrUpdateBook(book: Book) {
        viewModelScope.launch {
            Log.v(TAG, "saveOrUpdateBook...");

            mutableFetching.value = true
            mutableException.value = null

            val result: Result<Book>
            var operation = ""

            if (book._id.isNotEmpty()) {
                operation = "update"
                result = bookRepository.update(book)
            } else {
                var id = generateRandomString(10)
                book._id = id
                operation = "save"
                result = bookRepository.save(book)
            }
            when (result) {
                is Result.Success -> {
                    Log.d(TAG, "saveOrUpdateBook succeeded");
                }
                is Result.Error -> {
                    Log.w(TAG, "saveOrUpdateBook failed", result.exception);
                    mutableException.value = result.exception
                }
            }
            mutableCompleted.value = true
            mutableFetching.value = false
        }
    }

    fun generateRandomString(length: Int) : String {
        val allowedChars = ('A'..'Z') + ('a'..'z') + ('0'..'9')
        return (1..length)
            .map { allowedChars.random() }
            .joinToString("")
    }


    // create a worker to synchronize the data as soon as possible
    private fun createJob(operation: String, book: Book): OneTimeWorkRequest {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val inputData = Data.Builder()
            .putString("operation", operation)
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
            .addTag(TAG_OUTPUT)
            .build()

        return myWork
    }
}