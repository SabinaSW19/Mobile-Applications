package com.ma.androidlab.book.books

import android.app.Application
import android.util.Log
import androidx.lifecycle.*
import com.ma.androidlab.book.data.Book
import com.ma.androidlab.book.data.BookRepository
import com.ma.androidlab.book.data.local.BooksDatabase
import com.ma.androidlab.core.TAG
import kotlinx.coroutines.launch
import com.ma.androidlab.core.Result

class BookListViewModel(application: Application) : AndroidViewModel(application) {
    private val mutableLoading = MutableLiveData<Boolean>().apply { value = false }
    private val mutableException = MutableLiveData<Exception>().apply { value = null }

    val books: LiveData<List<Book>>
    val loading: LiveData<Boolean> = mutableLoading
    val loadingError: LiveData<Exception> = mutableException

    val bookRepository: BookRepository

    init {
        val bookDao = BooksDatabase.getDatabase(application, viewModelScope).bookDao()
        bookRepository =BookRepository(bookDao)
        books = bookRepository.books
    }

    fun refresh() {
        viewModelScope.launch {
            Log.v(TAG, "refresh...");
            mutableLoading.value = true
            mutableException.value = null
            when (val result = bookRepository.refresh()) {
                is Result.Success -> {
                    Log.d(TAG, "refresh succeeded");
                }
                is Result.Error -> {
                    Log.w(TAG, "refresh failed", result.exception);
                    mutableException.value = result.exception
                }
            }
            mutableLoading.value = false
        }
    }

}