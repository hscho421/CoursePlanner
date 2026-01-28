import pandas as pd

# Load the CSV file into a DataFrame (replace 'your_file.csv' with the path to your file)
data_path = 'raw.csv'
data = pd.read_csv(data_path)

# Combine rows by Subject and Number, summing the grade columns
# Assuming grade columns are from A+ to F
grade_columns = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F", "W"]

# Group by Subject and Number
combined_data = data.groupby(["Subject", "Number"]).agg(
    {col: 'sum' for col in grade_columns} | {"Course Title": "first", "Sched Type": "first", "Primary Instructor": "first"}
).reset_index()

# Compute the total number of students per course (sum of all grade columns except "W")
combined_data['Total Students'] = combined_data[grade_columns[:-1]].sum(axis=1)

# Define the GPA scale
gpa_scale = {
    "A+": 4.0, "A": 4.0, "A-": 3.67,
    "B+": 3.33, "B": 3.0, "B-": 2.67,
    "C+": 2.33, "C": 2.0, "C-": 1.67,
    "D+": 1.33, "D": 1.0, "D-": 0.67,
    "F": 0.0
}

# Calculate GPA
grade_points = sum(combined_data[grade] * gpa_scale[grade] for grade in grade_columns[:-1])
combined_data['GPA'] = (grade_points / combined_data['Total Students']).round(2)

# Reorder columns: Subject, Number, Course Title, then grades, GPA, with Total Students at the end
ordered_columns = ["Subject", "Number", "Course Title"] + grade_columns + ["Total Students", "GPA"]
combined_data = combined_data[ordered_columns]

# Save the combined DataFrame to a new CSV file
output_path = 'filtered.csv'
combined_data.to_csv(output_path, index=False)

print(f"Combined data with GPA saved to {output_path}")
