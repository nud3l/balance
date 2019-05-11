import csv
import json

closing = {
    0: 1,
    1: 2,
    2: 3
}


counters = [0, 0, 0, 0]

with open('channel_close_status_2.csv', 'r') as csv_file:
    csv_reader = csv.reader(csv_file, delimiter=',')
    next(csv_reader, None)
    for row in csv_reader:
        counter = closing[int(row[1])]
        counters[counter] += 1

with open("graph.json") as file:
    graph = json.load(file)
    edges = graph["edges"]

counters[0] = len(edges) - counters[1] - counters[2] - counters[3]
print("Total ", len(edges))
print("0pen ", counters[0])
print("Mutual close ", counters[1])
print("Unilateral close ", counters[2])
print("Revoked ", counters[3])
