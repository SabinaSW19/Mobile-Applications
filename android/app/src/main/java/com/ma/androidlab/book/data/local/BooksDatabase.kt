package com.ma.androidlab.book.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.ma.androidlab.book.data.Book
import kotlinx.coroutines.CoroutineScope

@Database(entities = [Book::class], version = 1)
@TypeConverters(Converters::class)
abstract class BooksDatabase : RoomDatabase() {

    abstract fun bookDao(): BookDao

    companion object {
        @Volatile
        private var INSTANCE: BooksDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): BooksDatabase {
            val inst = INSTANCE
            if (inst != null) {
                return inst
            }
            val instance =
                Room.databaseBuilder(
                    context.applicationContext,
                    BooksDatabase::class.java,
                    "books_db"
                )
                    //.addCallback(WordDatabaseCallback(scope))
                    .build()
            INSTANCE = instance
            return instance
        }

//        private class WordDatabaseCallback(private val scope: CoroutineScope) :
//            RoomDatabase.Callback() {
//
//            override fun onOpen(db: SupportSQLiteDatabase) {
//                super.onOpen(db)
//                INSTANCE?.let { database ->
//                    scope.launch(Dispatchers.IO) {
//                        populateDatabase(database.expenseDao())
//                    }
//                }
//            }
//        }
//
//        suspend fun populateDatabase(expenseDao: ExpenseDao) {
////            expenseDao.deleteAll()
////            val expense = Expense("1", "Hello", 0, false)
////            expenseDao.insert(expense)
//        }
    }

}