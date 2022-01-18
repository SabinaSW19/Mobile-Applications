package com.ma.androidlab.book.data

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.ma.androidlab.book.data.remote.BookApi
import com.ma.androidlab.core.TAG
import java.util.*

class SyncWorker (context: Context,
                  workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val operation = inputData.getString("operation")
        val id = inputData.getString("id").orEmpty()
        val title = inputData.getString("title").orEmpty()
        val author = inputData.getString("author").orEmpty()
        val price = inputData.getInt("price", 0)
        val isAvailable = inputData.getBoolean("isAvailable", false)
        val dateDay = inputData.getInt("dateDay", 1)
        val dateMonth = inputData.getInt("dateMonth", 1)
        val dateYear = inputData.getInt("dateYear", 2022)
        val date = Date(dateYear, dateMonth, dateDay)

        val e = Book(id, title,author, price, date, isAvailable)

        try {
            Log.v(TAG, "sync - started")
            if(operation.equals("save")){
                val createdBook = BookApi.service.create(e)
            }
            else if(operation.equals("update")){
                val updatedBook = BookApi.service.update(id, e)
            }

            Log.v(TAG, "sync - succeeded")
            return Result.success()
        } catch (e: Exception) {
            Log.w(TAG, "sync - failed", e)
            return Result.failure()
        }

    }

}