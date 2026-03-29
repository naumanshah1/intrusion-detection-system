def apply_rules(sample, rules):
    """Evaluate custom rules against a sample"""
    for rule in rules:
        field = rule.field
        operator = rule.operator
        value = rule.value
        
        # Get sample value safely
        if field not in sample:
            continue
            
        sample_value = sample[field]
        
        try:
            # Convert to float for numeric comparison
            sample_float = float(sample_value)
            rule_float = float(value)
            
            if operator == ">" and sample_float > rule_float:
                return 1  # Attack detected
            elif operator == "<" and sample_float < rule_float:
                return 1
            elif operator == "==" and sample_float == rule_float:
                return 1
            elif operator == "!=" and sample_float != rule_float:
                return 1
            elif operator == ">=" and sample_float >= rule_float:
                return 1
            elif operator == "<=" and sample_float <= rule_float:
                return 1
        except (ValueError, TypeError):
            # String comparison
            if operator == "==" and str(sample_value) == str(value):
                return 1
            elif operator == "!=" and str(sample_value) != str(value):
                return 1
    
    return 0  # No rules triggered