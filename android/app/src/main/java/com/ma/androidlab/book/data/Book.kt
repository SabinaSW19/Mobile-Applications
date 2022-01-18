package com.ma.androidlab.book.data

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.*


@Entity(tableName = "books")
data class Book(
    @PrimaryKey @ColumnInfo(name = "_id") var _id: String,
    @ColumnInfo(name = "title") var title: String,
    @ColumnInfo(name = "author") var author: String,
    @ColumnInfo(name = "price") var price: Int,
    @ColumnInfo(name = "dateOfPublication") var dateOfPublication: Date,
    @ColumnInfo(name = "isAvailable") var isAvailable: Boolean
) {
    override fun toString(): String =
        "title = " + title + " author = " + author + " price = " + price + " dateOfPublication = " + dateOfPublication + " isAvailable = " + isAvailable
}