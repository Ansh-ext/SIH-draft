def calculate_pump_efficiency(input_power, output_power):
    return (output_power / input_power) * 100

# Example usage
input_power = 1000  # in watts
output_power = 800   # in watts
efficiency = calculate_pump_efficiency(input_power, output_power)
print(f'Pump efficiency: {efficiency:.2f}%')