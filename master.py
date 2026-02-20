from tkinter import *
from tkinter import ttk
root = Tk()
root.geometry("800x500")
root.title("Numerical Methods")
frame1 = Frame(root)
frame2 = Frame(root)
frame3 = Frame(root)
def main():
    frame2.pack_forget()
    frame3.pack_forget()
    frame1.pack(fill="both", expand=True)

def ch_one_methods():
    frame1.pack_forget()
    frame3.pack_forget()
    frame2.pack(fill="both", expand=True)

def ch_two_methods():
    frame1.pack_forget()
    frame2.pack_forget()
    frame3.pack(fill="both", expand=True)


#############################  main content  #######################################
Label(frame1, text="Numerical Methods").pack()
btn_ch_one = Button(frame1,
                 text="Method's chapter one",
                 command=ch_one_methods)
btn_ch_two = Button(frame1,
                    text="Method's chapter two",
                    command=ch_two_methods)
btn_ch_one.pack()
btn_ch_two.pack()
#############################content chapter one#######################################
options_method_one = ["Bisection"]
Button(frame2, text="Back", command=main).pack(fill="x")
Label(frame2, text="Chapter One Methods").pack()

combo = ttk.Combobox(frame2, values=options_method_one, font=("Arial", 16),state="readonly")
combo.set("Choose Method")
combo.pack(pady=50)


#############################content chapter two#######################################
Button(frame3, text="Back", command=main).pack(fill="x")
Label(frame3, text="Chapter two Methods").pack()


main()
root.mainloop()

