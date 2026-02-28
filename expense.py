import tkinter as tk
from tkinter import messagebox
import datetime
import json
import os


class SimpleExpenseTracker:
    def __init__(self):
        # Create main window
        self.window = tk.Tk()
        self.window.title("Expense Tracker")
        self.window.geometry("800x500")
        self.window.configure(bg="#f0f0f0")

        # Data file
        self.datafile = "expenses.json"
        self.createdatafile()

        # Create UI
        self.createwidgets()
        self.refreshdisplay()

    def createdatafile(self):
        if not os.path.exists(self.datafile):
            with open(self.datafile, 'w') as f:
                json.dump([], f)

    def createwidgets(self):
        # Title
        title = tk.Label(
            self.window,
            text="💰 Expense Tracker",
            font=("Arial", 20, "bold"),
            bg="#4CAF50",
            fg="white"
        )
        title.pack(fill=tk.X, pady=(0, 10))

        # Main frame
        mainframe = tk.Frame(self.window, bg="#f0f0f0")
        mainframe.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # LEFT SIDE (INPUT)
        inputframe = tk.Frame(mainframe, bg="white", relief="ridge", bd=2)
        inputframe.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))

        tk.Label(
            inputframe,
            text="Add New Expense",
            font=("Arial", 14, "bold"),
            bg="white"
        ).pack(pady=10)

        # Monthly Income
        tk.Label(inputframe, text="Monthly Income (₹):", bg="white").pack(anchor="w", padx=10)
        self.incomeentry = tk.Entry(inputframe, width=20)
        self.incomeentry.pack(padx=10, pady=(0, 10))

        # Date
        tk.Label(inputframe, text="Date (DD/MM/YYYY):", bg="white").pack(anchor="w", padx=10)
        self.dateentry = tk.Entry(inputframe, width=20)
        self.dateentry.pack(padx=10, pady=(0, 10))
        self.dateentry.insert(0, datetime.datetime.now().strftime("%d/%m/%Y"))

        # Amount
        tk.Label(inputframe, text="Amount (₹):", bg="white").pack(anchor="w", padx=10)
        self.amountentry = tk.Entry(inputframe, width=20)
        self.amountentry.pack(padx=10, pady=(0, 10))

        # Category
        tk.Label(inputframe, text="Category:", bg="white").pack(anchor="w", padx=10)
        self.categoryvar = tk.StringVar(value="Food")
        categories = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Healthcare", "Other"]
        tk.OptionMenu(inputframe, self.categoryvar, *categories).pack(padx=10, pady=(0, 10))

        # Description
        tk.Label(inputframe, text="Description:", bg="white").pack(anchor="w", padx=10)
        self.descentry = tk.Entry(inputframe, width=20)
        self.descentry.pack(padx=10, pady=(0, 10))

        # Buttons
        tk.Button(
            inputframe,
            text="Add Expense",
            command=self.addexpense,
            bg="#4CAF50",
            fg="white",
            font=("Arial", 10, "bold")
        ).pack(pady=5)

        tk.Button(
            inputframe,
            text="Clear Form",
            command=self.clearform,
            bg="#9E9E9E",
            fg="white"
        ).pack(pady=5)

        # RIGHT SIDE (DISPLAY)
        displayframe = tk.Frame(mainframe, bg="white", relief="ridge", bd=2)
        displayframe.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        # Summary
        summaryframe = tk.Frame(displayframe, bg="#2196F3")
        summaryframe.pack(fill=tk.X, pady=(0, 10))

        self.totallabel = tk.Label(
            summaryframe,
            text="Total: ₹0.00",
            font=("Arial", 14, "bold"),
            bg="#2196F3",
            fg="white"
        )
        self.totallabel.pack(pady=5)

        self.monthlabel = tk.Label(
            summaryframe,
            text="This Month Expenses: ₹0.00",
            bg="#2196F3",
            fg="white"
        )
        self.monthlabel.pack(pady=5)

        self.incomelabel = tk.Label(
            summaryframe,
            text="Monthly Income: ₹0.00",
            bg="#2196F3",
            fg="white"
        )
        self.incomelabel.pack(pady=5)

        self.savingslabel = tk.Label(
            summaryframe,
            text="Monthly Savings: ₹0.00",
            font=("Arial", 12, "bold"),
            bg="#2196F3",
            fg="yellow"
        )
        self.savingslabel.pack(pady=5)

        # Expense List
        tk.Label(displayframe, text="Expense List", font=("Arial", 12, "bold"), bg="white").pack(pady=5)

        listframe = tk.Frame(displayframe)
        listframe.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        scrollbar = tk.Scrollbar(listframe)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.expenselistbox = tk.Listbox(
            listframe,
            yscrollcommand=scrollbar.set,
            font=("Courier", 9)
        )
        self.expenselistbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.config(command=self.expenselistbox.yview)

        tk.Button(
            displayframe,
            text="Delete Selected",
            command=self.deleteexpense,
            bg="#f44336",
            fg="white",
            font=("Arial", 10, "bold")
        ).pack(pady=10)

    def addexpense(self):
        try:
            date = self.dateentry.get().strip()
            amounttext = self.amountentry.get().strip()
            category = self.categoryvar.get()
            description = self.descentry.get().strip()

            if not date or not amounttext:
                messagebox.showerror("Error", "Fill date and amount")
                return

            amount = float(amounttext)
            if amount <= 0:
                messagebox.showerror("Error", "Amount must be > 0")
                return

            datetime.datetime.strptime(date, "%d/%m/%Y")

            with open(self.datafile, 'r') as f:
                expenses = json.load(f)

            expenses.append({
                "date": date,
                "amount": amount,
                "category": category,
                "description": description
            })

            with open(self.datafile, 'w') as f:
                json.dump(expenses, f, indent=2)

            self.refreshdisplay()
            self.clearform()
            messagebox.showinfo("Success", "Expense Added")

        except Exception as e:
            messagebox.showerror("Error", str(e))

    def deleteexpense(self):
        selection = self.expenselistbox.curselection()
        if not selection:
            messagebox.showwarning("Warning", "Select an expense")
            return

        with open(self.datafile, 'r') as f:
            expenses = json.load(f)

        del expenses[selection[0]]

        with open(self.datafile, 'w') as f:
            json.dump(expenses, f, indent=2)

        self.refreshdisplay()

    def refreshdisplay(self):
        with open(self.datafile, 'r') as f:
            expenses = json.load(f)

        self.expenselistbox.delete(0, tk.END)

        total = 0
        monthlytotal = 0
        currentmonth = datetime.datetime.now().strftime("%m/%Y")

        for e in expenses:
            text = f"{e['date']:12} ₹{e['amount']:8.2f} {e['category']:12} {e['description']}"
            self.expenselistbox.insert(tk.END, text)
            total += e["amount"]

            if datetime.datetime.strptime(e["date"], "%d/%m/%Y").strftime("%m/%Y") == currentmonth:
                monthlytotal += e["amount"]

        try:
            income = float(self.incomeentry.get())
        except:
            income = 0

        savings = income - monthlytotal

        self.totallabel.config(text=f"Total: ₹{total:.2f}")
        self.monthlabel.config(text=f"This Month Expenses: ₹{monthlytotal:.2f}")
        self.incomelabel.config(text=f"Monthly Income: ₹{income:.2f}")
        self.savingslabel.config(text=f"Monthly Savings: ₹{savings:.2f}")

    def clearform(self):
        self.amountentry.delete(0, tk.END)
        self.categoryvar.set("Food")
        self.descentry.delete(0, tk.END)

    def run(self):
        self.window.mainloop()


if __name__ == "__main__":
    app = SimpleExpenseTracker()
    app.run()