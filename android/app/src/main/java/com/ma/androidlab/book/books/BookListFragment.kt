package com.ma.androidlab.book.books

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.Navigation.findNavController
import androidx.navigation.fragment.findNavController
import com.ma.androidlab.MainActivity
import com.ma.androidlab.R
import com.ma.androidlab.auth.data.AuthRepository
import com.ma.androidlab.core.TAG
import com.ma.androidlab.databinding.FragmentBookListBinding

class BookListFragment : Fragment() {

    private lateinit var booksListAdapter: BookListAdapter
    private lateinit var booksModel: BookListViewModel

    private var _binding: FragmentBookListBinding? = null

    // This property is only valid between onCreateView and
    // onDestroyView.
    private val binding get() = _binding!!

    val CHANNEL_ID = "CHANNEL_ID"
    var onStart = true

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {

        Log.i(TAG, "onCreateView")
        _binding = FragmentBookListBinding.inflate(inflater, container, false)
        return binding.root

    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        Log.i(TAG, "onViewCreated")
        if (!AuthRepository.isLoggedIn) {
            findNavController().navigate(R.id.FragmentLogin)
            return;
        }
        setupBookList()
        binding.fab.setOnClickListener {
            Log.v(TAG, "Add new book")
            findNavController().navigate(R.id.action_BookListFragment_to_BookEditFragment)
        }


        //createNotificationChannel()
        //createNotification()


    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
        Log.i(TAG, "onDestroyView")
    }

    private fun setupBookList() {
        booksListAdapter = BookListAdapter(this)
        binding.bookList.adapter = booksListAdapter
        booksModel = ViewModelProvider(this).get(BookListViewModel::class.java)

        booksModel.books.observe(viewLifecycleOwner, { value ->
            Log.i(TAG, "update books")
            booksListAdapter.books = value
        })

        booksModel.loading.observe(viewLifecycleOwner, { loading ->
            Log.i(TAG, "update loading")
            binding.progress.visibility = if (loading) View.VISIBLE else View.GONE
        })

        booksModel.loadingError.observe(viewLifecycleOwner, { exception ->
            if (exception != null) {
                Log.i(TAG, "update loading error")
                val message = "Loading exception ${exception.message}"
                Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
            }
        })

        booksModel.refresh()

    }

    private fun createNotification() {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent: PendingIntent = PendingIntent.getActivity(activity, 0, intent, 0)
        val builder = context?.let {
            NotificationCompat.Builder(it, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle("Welcome!")
                .setContentText("Bine ai venit!")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                //.setContentIntent(pendingIntent)
                .setAutoCancel(true)
        }
        with(NotificationManagerCompat.from(requireContext())) {
            if (builder != null) {
                notify(1, builder.build())
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = "My channel name"
            val descriptionText = "My channel description"
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(CHANNEL_ID, name, importance).apply {
                description = descriptionText
            }
            val notificationManager: NotificationManager =
                activity?.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}