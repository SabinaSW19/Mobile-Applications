package com.ma.androidlab.book.books

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.RecyclerView
import com.ma.androidlab.R
import com.ma.androidlab.book.book.BookEditFragment
import com.ma.androidlab.book.data.Book
import com.ma.androidlab.core.TAG
import java.util.*

class BookListAdapter(
    private val fragment: Fragment,
) : RecyclerView.Adapter<BookListAdapter.ViewHolder>() {

    var books = emptyList<Book>()
        set(value) {
            field = value
            notifyDataSetChanged();
        }

    private var onBookClick: View.OnClickListener = View.OnClickListener { view ->
        val book = view.tag as Book

        fragment.findNavController().navigate(R.id.BookEditFragment, Bundle().apply {
            putString(BookEditFragment.BOOK_ID, book._id)
        })
    };
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.view_book, parent, false)
        Log.v(TAG, "onCreateViewHolder")
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        Log.v(TAG, "onBindViewHolder $position")

        val book = books[position]
        holder.titleView.text = book.title
        holder.authorView.text = book.author
        holder.priceView.text = book.price.toString()

        val calendar = Calendar.getInstance()
        calendar.time = book.dateOfPublication
        val dateString = calendar.get(Calendar.DAY_OF_MONTH).toString() + " " +
                calendar.getDisplayName(Calendar.MONTH, Calendar.LONG, Locale.getDefault()) + " " +
                calendar.get(Calendar.YEAR).toString()

        holder.date.text = dateString

        holder.isAvailableView.text = if (book.isAvailable) "Yes" else "No"
        holder.itemView.tag = book
        holder.itemView.setOnClickListener(onBookClick)
    }

    override fun getItemCount() = books.size

    inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val titleView: TextView
        val authorView: TextView
        val priceView: TextView
        val isAvailableView: TextView
        val date: TextView

        init {
            titleView = view.findViewById(R.id.title)
            authorView = view.findViewById(R.id.author)
            priceView = view.findViewById(R.id.price)
            isAvailableView = view.findViewById(R.id.isAvailable)
            date = view.findViewById(R.id.dateOfPublication)
        }
    }
}