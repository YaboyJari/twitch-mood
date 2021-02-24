const tf = require('@tensorflow/tfjs');
const { getTensorData, getData } = require('./mood-data');

let myModel
const learningRate = 0.003;
const epochs = 50;
const batchSize = 4000;
const validationSplit = 0.2;

labelArray = [ 'anger', 'fear', 'joy', 'love', 'sadness', 'surprise' ]

const createModel = (learningRate) => {
    const model = tf.sequential();
    model.add(tf.layers.dense({
        units: 32,
        inputShape: [194433],
        useBias: true,
        activation: 'relu',
    }));
    model.add(tf.layers.dropout({
        rate: 0.2,
    }));
    model.add(tf.layers.dense({
        units: 6,
        activation: 'softmax',
    }));
    model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model
};

const trainModel = async (model, train_features, train_label, epochs, batchSize = null, validationSplit = 0.1) => {
    return await model.fit(train_features, train_label, {
        batchSize,
        epochs,
        shuffle: true,
        validationSplit,
    });
};

const castTensorToArray = (data) => {
    return Array.from(data.dataSync());
}

exports.startTraining = async () => {
    const data = await getData('train.csv');
    const tensorData = await getTensorData(data);

    myModel = createModel(learningRate);

    await trainModel(myModel, tensorData.x_features, tensorData.y_labels, 
        epochs, batchSize, validationSplit);
    
    await myModel.save('file://model');
};

exports.predictTestData = async (model) => {
    const data = await getData('test.csv');
    const tensorData = await getTensorData(data);
    const testLabels = tensorData.y_labels;
    const predictions = model.predict(tensorData.x_features, {batchSize: batchSize}).argMax(-1);
    labelData = castTensorToArray(testLabels);
    predictionData = castTensorToArray(predictions);
    return [predictionData, labelData];
};

exports.predictSingleData = async (sentence, model) => {
    let featureArray = [];
    featureArray.push(sentence);
    console.log(featureArray);
    const data  = {
        featureArray,
        labelArray,
    }
    const tensorData = await getTensorData(data);
    const predictions = model.predict(tensorData.x_features, {batchSize: batchSize}).argMax(-1);
    predictionData = castTensorToArray(predictions);
    console.log(labelArray[predictionData]);
};