from src.rule_engine import rule_based_detection
def hybrid_predict(sample, sample_array, model, thresholds):
    # Rule-based check
    if rule_based_detection(sample, thresholds) == 1:
        return 1

    # ML prediction
    return model.predict([sample_array])[0]