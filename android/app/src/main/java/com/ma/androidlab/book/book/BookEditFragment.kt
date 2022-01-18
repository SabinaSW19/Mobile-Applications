package com.ma.androidlab.book.book

import android.animation.ValueAnimator
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.Navigation.findNavController
import androidx.navigation.fragment.findNavController
import com.ma.androidlab.R
import com.ma.androidlab.book.data.Book
import com.ma.androidlab.core.TAG
import com.ma.androidlab.databinding.FragmentBookEditBinding
import java.util.*
import java.util.Calendar.*

class BookEditFragment : Fragment() {

    companion object {
        const val BOOK_ID = "BOOK_ID"
    }

    private lateinit var viewModel: BookEditViewModel
    private var bookId: String? = null
    private var book: Book? = null

    private var _binding: FragmentBookEditBinding? = null

    private val binding get() = _binding!!


    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {

        Log.i(TAG, "onCreateView")
        arguments?.let {
            if (it.containsKey(BOOK_ID)) {
                bookId = it.getString(BOOK_ID).toString()
            }
        }

        _binding = FragmentBookEditBinding.inflate(inflater, container, false)
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        Log.i(TAG, "onViewCreated")
        setupViewModel()
        binding.fab.setOnClickListener {
            Log.v(TAG, "Save book")

            val title = binding.bookTitle.text.toString()

            if(title.isEmpty()){
                Toast.makeText(activity, "Title cannot be empty!", Toast.LENGTH_LONG).show()
                animateTitleView()
                return@setOnClickListener
            }

            val priceString = binding.bookPrice.text.toString()
            val onlyDigits = priceString.all { it in '0'..'9'}
            if(! onlyDigits || Integer.parseInt(priceString) == 0){

                Toast.makeText(activity, "Invalid price - it must contain only digits and be greater than 0!", Toast.LENGTH_LONG).show()
                animatePriceView()
            }
            else{
                val price = Integer.parseInt(priceString)
                val day: Int = binding.bookDateOfPublication.dayOfMonth
                val month: Int = binding.bookDateOfPublication.month
                val year: Int = binding.bookDateOfPublication.year
                val calendar: Calendar = Calendar.getInstance()
                calendar.set(year, month, day)
                val date = calendar.time
                val isAvailable = binding.bookIsAvailable.isChecked
                val author = binding.bookAuthor.text.toString()

                val b = book
                if(b != null){
                    b.title = title
                    b.author = author
                    b.price = price
                    b.dateOfPublication = date
                    b.isAvailable = isAvailable

                    viewModel.saveOrUpdateBook(b)
                }

            }

        }

    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
        Log.i(TAG, "onDestroyView")
    }


    private fun animatePriceView() {
        ValueAnimator.ofFloat(0f, 200f, 0f).apply {
            duration = 500
            repeatCount = 3
            start()
            addUpdateListener {
                binding.bookPrice.translationX = it.animatedValue as Float
            }
        }
    }

    private fun animateTitleView(){
        binding.bookTitle.apply {
            translationX = 0f
            visibility = View.VISIBLE
            animate().rotation(36000f)
                .setDuration(1000)
                .setListener(null)
        }
    }


    private fun setupViewModel() {
        viewModel = ViewModelProvider(this).get(BookEditViewModel::class.java)

        viewModel.book.observe(viewLifecycleOwner, { book ->
            Log.v(TAG, "update books")
            binding.bookTitle.setText(book.title)
            binding.bookAuthor.setText(book.author)
            binding.bookPrice.setText(book.price.toString())
            binding.bookIsAvailable.isChecked = book.isAvailable


            val calendar = Calendar.getInstance()
            calendar.time = book.dateOfPublication

            binding.bookDateOfPublication.updateDate(calendar.get(YEAR), calendar.get(MONTH), calendar.get(
                DAY_OF_MONTH))

        })

        viewModel.fetching.observe(viewLifecycleOwner, { fetching ->
            Log.v(TAG, "update fetching")
            binding.progress.visibility = if (fetching) View.VISIBLE else View.GONE
        })

        viewModel.fetchingError.observe(viewLifecycleOwner, { exception ->
            if (exception != null) {
                Log.v(TAG, "update fetching error")
                val message = "Fetching exception ${exception.message}"
                val parentActivity = activity?.parent
                if (parentActivity != null) {
                    Toast.makeText(parentActivity, message, Toast.LENGTH_SHORT).show()
                }
            }
        })

        viewModel.completed.observe(viewLifecycleOwner, { completed ->
            if (completed) {
                Log.v(TAG, "completed, navigate back")
                findNavController().navigate(R.id.action_BookEditFragment_to_BookListFragment)
            }
        })


        val id = bookId
        if (id == null) {
            book = Book("","", "", 0, Date(), false)
        } else {
            viewModel.getBookById(id).observe(viewLifecycleOwner, { bk ->
                Log.v(TAG, "update books")
                if (bk != null) {
                    book = bk
                    binding.bookTitle.setText(bk.title)
                    binding.bookAuthor.setText(bk.author)
                    binding.bookPrice.setText(bk.price.toString())
                    binding.bookIsAvailable.isChecked = bk.isAvailable
                    val calendar = Calendar.getInstance()
                    calendar.time = bk.dateOfPublication

                    binding.bookDateOfPublication.updateDate(calendar.get(YEAR), calendar.get(MONTH), calendar.get(
                        DAY_OF_MONTH))
                }
            })
        }
    }


}