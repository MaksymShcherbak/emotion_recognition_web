from threading import Thread, Lock
from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
import numpy as np
import cv2
import base64
import uuid
import os

models = {
    "model_dense": {
        "model": load_model("../model_dense.keras"),
        "image_size": (48, 48),
    },
    "model_convolutional": {
        "model": load_model("../model_convolutional.keras"),
        "image_size": (48, 48),
    },
    "model_mobilenetv2": {
        "model": load_model("../model_mobilenetv2.keras"),
        "image_size": (224, 224),
    },
}

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
class_labels = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]

app = Flask(__name__)

client_progress = {}
lock = Lock()


@app.route("/models", methods=["GET"])
def get_models():
    return jsonify(list(models.keys()))


@app.route("/progress", methods=["GET"])
def get_progress():
    global client_progress
    clientId = request.args.get("clientId")
    with lock:
        progress = client_progress.get(clientId, {"error": "Unknown client ID"})
    return jsonify({"progress": progress})


def update_progress(clientId, new_progress):
    global client_progress
    with lock:
        client_progress[clientId] = new_progress
    print(f"Updated progress for client {clientId}: {new_progress}")


def predict_image(clientId, file_content, model):
    try:
        update_progress(clientId, {"msg": "Reading Image", "fraction": 0.0})

        img = np.frombuffer(file_content, np.uint8)
        img = cv2.imdecode(img, cv2.IMREAD_GRAYSCALE)

        update_progress(clientId, {"msg": "Looking for Face", "fraction": 0.2})

        faces = face_cascade.detectMultiScale(img, scaleFactor=1.1, minNeighbors=5)

        if len(faces) == 0:
            update_progress(clientId, {"error": "No Face detected in the Image"})
            return

        update_progress(
            clientId, {"msg": "Cropping and Resizing Image", "fraction": 0.4}
        )

        (x, y, w, h) = faces[0]
        face_img = img[y : y + h, x : x + w]
        face_img_resized = cv2.resize(face_img, model["image_size"])

        _, buffer = cv2.imencode(".jpg", face_img_resized)
        face_img_base64 = base64.b64encode(buffer).decode("utf-8")

        update_progress(clientId, {"msg": "Preprocessing Image", "fraction": 0.6})

        face_img_resized = (
            face_img_resized.reshape((1,) + model["image_size"] + (1,)).astype(
                "float32"
            )
            / 255.0
        )

        if model["image_size"][0] != 48:
            face_img_resized = np.tile(face_img_resized, (1, 1, 1, 3))

        update_progress(clientId, {"msg": "Model Prediction", "fraction": 0.8})

        predictions = model["model"].predict(face_img_resized)

        prediction_response = [
            {"label": class_labels[i], "probability": float(pred)}
            for i, pred in enumerate(predictions[0])
        ]
        update_progress(
            clientId,
            {
                "msg": "Completed",
                "fraction": 1.0,
                "predictions": prediction_response,
                "face_img": face_img_base64,
            },
        )

    except Exception as e:
        update_progress(clientId, {"error": str(e)})


def predict_video(clientId, video_file_path, model):
    try:
        update_progress(clientId, {"msg": "Reading Video", "fraction": 0.0})

        video_capture = cv2.VideoCapture(video_file_path)

        predictions = []
        total_frames = int(video_capture.get(cv2.CAP_PROP_FRAME_COUNT))
        i = 0
        while True:
            i += 1
            update_progress(
                clientId,
                {
                    "msg": f"Predicting Frame {i}/{total_frames}",
                    "fraction": 0.9 * i / total_frames,
                },
            )

            ret, frame = video_capture.read()
            if not ret:
                break

            frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

            faces = face_cascade.detectMultiScale(
                frame_gray, scaleFactor=1.1, minNeighbors=5
            )

            predictions_row = []
            for x, y, w, h in faces:
                face_img = frame_gray[y : y + h, x : x + w]
                face_img_resized = cv2.resize(face_img, model["image_size"])
                face_img_resized = (
                    face_img_resized.reshape((1,) + model["image_size"] + (1,)).astype(
                        "float32"
                    )
                    / 255.0
                )

                if model["image_size"][0] != 48:
                    face_img_resized = np.tile(face_img_resized, (1, 1, 1, 3))

                predictions_row.append(model["model"].predict(face_img_resized)[0])

            predictions.append(predictions_row)

        video_capture.release()

        transformed_predictions = []

        for row in predictions:
            transformed_predictions.append(
                [
                    {"label": class_labels[i], "probability": float(prob)}
                    for i, prob in enumerate(row[0])
                ]
            )

        update_progress(
            clientId,
            {
                "msg": "Completed",
                "fraction": 1.0,
                "predictions": transformed_predictions,
            },
        )

    except Exception as e:
        update_progress(clientId, {"error": str(e)})

    finally:
        if os.path.exists(video_file_path):
            os.remove(video_file_path)


@app.route("/predict_image", methods=["POST"])
def post_predict_image():
    global client_progress
    clientId = str(uuid.uuid4())
    with lock:
        client_progress[clientId] = {}

    if "image" in request.files:
        file = request.files["image"]
        if file.filename == "":
            return jsonify({"error": "No image selected for uploading"}), 400
        file_content = file.read()
    else:
        return jsonify({"error": "No image part in the request"}), 400

    model = models[request.form.get("model", "model_mobilenetv2")]

    thread = Thread(target=predict_image, args=(clientId, file_content, model))
    thread.start()

    return jsonify({"clientId": clientId})


@app.route("/predict_video", methods=["POST"])
def post_predict_video():
    global client_progress
    clientId = str(uuid.uuid4())
    with lock:
        client_progress[clientId] = {}

    if "video" not in request.files:
        return jsonify({"error": "No video part in the request"}), 400
    video_file = request.files["video"]
    if video_file.filename == "":
        return jsonify({"error": "No video selected for uploading"}), 400

    video_file_path = f"./tmp/video{clientId}.mp4"
    video_file.save(video_file_path)

    model = models[request.form.get("model", "model_mobilenetv2")]

    thread = Thread(target=predict_video, args=(clientId, video_file_path, model))
    thread.start()

    return jsonify({"clientId": clientId})


if __name__ == "__main__":
    app.run(debug=False)
