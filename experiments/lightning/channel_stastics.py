import csv

closing = {-1: 0,
           0: 1,
           1: 2,
           2: 3}

counters = [0, 0, 0, 0]

with open('channel_close_status.csv', 'r') as csv_file:
    csv_reader = csv.reader(csv_file, delimiter=',')
    next(csv_reader, None)
    for row in csv_reader:
        counter = closing[int(row[1])]
        counters[counter] += 1

print("Still open ", counters[0])
print("Mutual close ", counters[1])
print("Unilateral close ", counters[2])
print("Revoked ", counters[3])
