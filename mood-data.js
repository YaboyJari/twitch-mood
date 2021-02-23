const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const tf = require('@tensorflow/tfjs');

const getEnglishWords = (fileName) => {
    let promise = new Promise(function (resolve, reject) {
        const results = [];
        fs.createReadStream(path.resolve(__dirname, 'files', fileName))
            .pipe(csv.parse({
                headers: false,
            }))
            .on('error', error => console.error(error))
            .on('data', row => {
                results.push(row[0]);
            })
            .on('end', async (rowCount) => {
                console.log(`Parsed ${rowCount} rows`);
                resolve(results);
            });
    });

    return promise;
};

exports.getData = async (fileName) => {
    let promise = new Promise(function (resolve, reject) {
        const results = [];
        const labelArray = [];
        fs.createReadStream(path.resolve(__dirname, 'files', fileName))
            .pipe(csv.parse({
                headers: false,
                delimiter: ';',
            }))
            .on('error', error => console.error(error))
            .on('data', row => {
                results.push(row[0]);
                labelArray.push(row[1])
            })
            .on('end', async (rowCount) => {
                console.log(`Parsed ${rowCount} rows`);
                resolve({
                    'featureArray': results,
                    'labelArray': labelArray
                });
            });
    });

    return promise;
};

const getUniqueWordsArray = (wordArray) => {
    const wordSet = new Set();
    wordArray.forEach(string => {
        const wordArray = string.split(" ");
        wordArray.forEach(word => {
            wordSet.add(word);
        });
    });
    return Array.from(wordSet).sort();
};

const getValueAndIndexes = (arr) => {
    const values = arr.filter(value => value !== 0);
    const indexes = arr.reduce((r, n, i) => {
        n !== 0 && r.push(i);
        return r;
    }, []);
    var combinedArray = values.map(function (value, index) {
        return [value, indexes[index]];
    });
    return combinedArray;
}

const normalizeStringDataSet = (features, voc) => {
    let normalizedFeatures = [];
    const parse = (t) => voc.map((w, i) => t.reduce((a, b) => b === w ? ++a : a, 0));
    features.forEach(feature => {
        const splitFeature = feature.split(" ");
        const parsedFeatures = parse(splitFeature);
        const valueAndIndex = getValueAndIndexes(parsedFeatures);
        normalizedFeatures.push(valueAndIndex);
    });

    console.log('Features normalized')

    return normalizedFeatures;
}

const setSparseToDenseTensor = (features, voc) => {
    const indicesArray = [];
    const valueArray = [];

    features.forEach((feature, index) => {
        feature.forEach(data => {
            indicesArray.push([index, data[1]]);
            valueArray.push(data[0]);
        })
    });

    const values = tf.tensor1d(valueArray, 'float32');
    const shape = [features.length, voc.length];
    return tf.sparseToDense(indicesArray, values, shape);
};

const transferToTensorData = (features, labels, voc) => {
    return tf.tidy(() => {
        features = setSparseToDenseTensor(features, voc);
        labels = tf.tensor(labels);
        return {
            'x_features': features,
            'y_labels': labels,
        };
    });
};

const mapLabelToCategory = (labels, uniqueLabels) => {
    const mappedLabels = [];
    uniqueLabels.forEach((label, index) => {
        mappedLabels.push({
            label,
            category: index,
        })
    });
    return labels.map(label => {
        return mappedLabels.find(x => x.label === label).category;
    });
};

exports.getTensorData = async (data) => {
    let features = data.featureArray;
    const sortedUniqueVocabulary = await getEnglishWords('english_words.csv');
    const uniqueLabels = getUniqueWordsArray(data.labelArray);
    let labels = mapLabelToCategory(data.labelArray, uniqueLabels);
    features = normalizeStringDataSet(features, sortedUniqueVocabulary);
    return transferToTensorData(features, labels, sortedUniqueVocabulary);
};