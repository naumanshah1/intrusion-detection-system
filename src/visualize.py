import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix
import os

# Create results folder if not exists
os.makedirs("results", exist_ok=True)


def plot_accuracy(models, accuracy):
    plt.figure()
    plt.bar(models, accuracy)
    plt.title("Model Accuracy Comparison")
    plt.xlabel("Models")
    plt.ylabel("Accuracy")

    for i, v in enumerate(accuracy):
        plt.text(i, v + 0.01, f"{v:.2f}", ha='center')

    plt.savefig("results/accuracy.png")
    plt.show()


def plot_metrics(models, precision, recall, f1):
    plt.figure()

    x = range(len(models))

    plt.plot(x, precision, marker='o', label="Precision")
    plt.plot(x, recall, marker='o', label="Recall")
    plt.plot(x, f1, marker='o', label="F1 Score")

    plt.xticks(x, models)
    plt.legend()
    plt.title("Performance Metrics Comparison")

    plt.savefig("results/metrics.png")
    plt.show()


def plot_conf_matrix(y_true, y_pred, title="Confusion Matrix"):
    plt.figure()

    cm = confusion_matrix(y_true, y_pred)

    sns.heatmap(cm, annot=True, fmt="d")
    plt.title(title)
    plt.xlabel("Predicted")
    plt.ylabel("Actual")

    plt.savefig("results/confusion_matrix.png")
    plt.show()