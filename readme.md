# Emotion Recognition 🐵

Recognizing emotions is something we as humans intuitively do - it's vital for our survival.

But how do we teach a computer to do the same?

![example1](example1.png)

_This is the repository for the Web App. If you're looking for the Jupyter Notebook, check out [https://github.com/MaksymShcherbak/emotion_recognition_train](https://github.com/MaksymShcherbak/emotion_recognition_train)_

Try out the Emotion Recognition neural network in this humble application! It consists of a few different models, each having a different architecture and efficiency.

There are three modes available:

1. Recognize photo
2. Recognize video
3. Recognize live (from camera)

![example1](example2.png)

![example1](example3.png)

This was my **Bachelor's Degree** project at university.

## Tech Stack

- 🐍 [Python](https://www.python.org/) as the most popular Programming language in the ML field.
- ⚡ [Keras/TensorFlow](https://keras.io/) Framework for building and training deep learning models.
- 🥤 [Flask](https://flask.palletsprojects.com/en/stable/) Framework for creating a web server.
- 🌎 [React](https://react.dev/) for creating the web client.

## Setting Up the Environment

If you want to build the project locally, you can use **Anaconda** to create the environment.

1. Install [Anaconda](https://www.anaconda.com/products/distribution).

2. Create the Conda environment using the provided `environment.yml` file:

```bat
conda env create -f environment.yml
```

3. Activate the environment:

```bat
conda activate tf-er-env
```

_If you encounter any issues while running the project on Windows, your system Python user packages may be leaking into the Conda environment._

To prevent this, disable Python user site-packages:

```bat
setx PYTHONNOUSERSITE 1
```

## Training the Models

The models come pre-trained, so this step is completely optional.

If you want to train the models yourself, check out the [Jupyter Notebook](https://github.com/MaksymShcherbak/emotion_recognition_train).

## Running the Application

Server:

```bat
cd server
python main.py
```

The server runs at `http://localhost:5000` by default.

Client:

```bat
cd client
npm install
npm run dev
```

The project will be launched with ⚡ (Vite)[https://vite.dev/].
