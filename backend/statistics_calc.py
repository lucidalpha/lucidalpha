def calculate_statistics(valuation_data, columns):
    """
    Calculates statistics for valuation data.
    Counts crossings into overvalued (> 75) and undervalued (< -75) zones.
    
    valuation_data: List of dicts, sorted by date (ascending inside this function preferred for logic)
    columns: List of columns to analyze (e.g. [{'key': 'val_0', 'label': 'Symbol 1'}])
    """
    stats = {}
    threshold_upper = 75
    threshold_lower = -75
    
    # Sort data by date ascending to process chronologically
    sorted_data = sorted(valuation_data, key=lambda x: x['date_obj']) # Assuming date_obj is added or we parse it
    
    for col in columns:
        key = col['key']
        label = col['label']
        
        count_upper = 0
        count_lower = 0
        
        # State tracking: 0 = middle, 1 = above upper, -1 = below lower
        # We need to know previous state to detect fresh entry
        # State tracking
        prev_state = 0
        durations_upper = []
        durations_lower = []
        durations_middle = []
        current_run_duration = 0 
        
        # Initialize state based on first point? 
        # Or safely assume we start in middle? 
        # Better: Check first point to set initial state, but don't count it as a cross?
        # Or just loop.
        
        first_point = True
        
        for row in sorted_data:
            if key not in row:
                continue
                
            # Determine current state
            val = row[key]
            # 0=middle, 1=upper, -1=lower
            current_state = 0
            if val > threshold_upper:
                current_state = 1
            elif val < threshold_lower:
                current_state = -1
            
            if first_point:
                prev_state = current_state
                first_point = False
                
                # If we start in a zone, we start counting duration?
                # User asked for "average number of trading days... remained in extreme area".
                # If we start in extremes without seeing the entry, we can't be sure about full duration.
                # Standard approach: Ignore the partial run at the start? Or count it?
                # Let's count it for simplicity, or treat 'first entry' as effectively index 0.
                if current_state != 0:
                    current_run_duration = 1
                continue
            
            # --- Duration Logic ---
            if current_state != 0:
                # We are in an extreme zone
                if current_state == prev_state:
                    # Continuing current run
                    current_run_duration += 1
                else:
                    # Changed state while being in extreme (e.g. 1 -> -1 or 0 -> 1/ -1)
                    # If we just entered (prev=0), start new count
                    if prev_state == 0:
                         durations_middle.append(current_run_duration)
                         current_run_duration = 1
                    else:
                        # We switched from one extreme to another directly (1 -> -1)
                        # Finish previous run
                        if prev_state == 1:
                            durations_upper.append(current_run_duration)
                        elif prev_state == -1:
                            durations_lower.append(current_run_duration)
                        # Start new run
                        current_run_duration = 1
            else:
                # We are in middle (0)
                if prev_state != 0:
                    # We Just left an extreme
                    if prev_state == 1:
                        durations_upper.append(current_run_duration)
                    elif prev_state == -1:
                        durations_lower.append(current_run_duration)
                    current_run_duration = 1
                else:
                    # Staying in middle
                    current_run_duration += 1

            # --- Crossing Count Logic (from before) ---
            # "cross from middle area into extremum"
            if prev_state == 0 and current_state == 1:
                count_upper += 1
            
            if prev_state == 0 and current_state == -1:
                count_lower += 1
                
            prev_state = current_state
            
        # Finish pending run
        if prev_state == 1:
            durations_upper.append(current_run_duration)
        elif prev_state == -1:
            durations_lower.append(current_run_duration)
        else:
            durations_middle.append(current_run_duration)
            
        # Calculate Averages
        avg_upper = 0
        if durations_upper:
            avg_upper = sum(durations_upper) / len(durations_upper)
            
        avg_lower = 0
        if durations_lower:
            avg_lower = sum(durations_lower) / len(durations_lower)
            
        avg_middle = 0
        if durations_middle:
            avg_middle = sum(durations_middle) / len(durations_middle)

        all_durations = durations_upper + durations_lower
        avg_total = 0
        if all_durations:
            avg_total = sum(all_durations) / len(all_durations)

        stats[key] = {
            'label': label,
            'count_upper': count_upper,
            'count_lower': count_lower,
            'total_extremes': count_upper + count_lower,
            'avg_duration_upper': round(avg_upper, 2),
            'avg_duration_lower': round(avg_lower, 2),
            'avg_duration_middle': round(avg_middle, 2),
            'avg_duration_total': round(avg_total, 2)
        }
        
    return stats
