/**
 * Built-in city lookup: the biggest US cities, every state capital, and
 * towns around the Carolinas and Georgia. City search answers from this list
 * instantly (and with no connection, as in the preview); the online lookup
 * adds anything not here. Coordinates are city centers, to two decimals.
 */
export const US_CITIES: [name: string, state: string, lat: number, lng: number][] = [
  // Upstate SC and nearby
  ['Anderson', 'SC', 34.50, -82.65], ['Clemson', 'SC', 34.68, -82.84], ['Greenville', 'SC', 34.85, -82.39],
  ['Spartanburg', 'SC', 34.95, -81.93], ['Seneca', 'SC', 34.69, -82.95], ['Easley', 'SC', 34.83, -82.60],
  ['Pendleton', 'SC', 34.65, -82.78], ['Greer', 'SC', 34.94, -82.23], ['Simpsonville', 'SC', 34.74, -82.25],
  ['Travelers Rest', 'SC', 34.97, -82.44], ['Walhalla', 'SC', 34.76, -83.06], ['Pickens', 'SC', 34.88, -82.71],
  ['Mauldin', 'SC', 34.78, -82.31], ['Fountain Inn', 'SC', 34.69, -82.20], ['Belton', 'SC', 34.52, -82.49],
  ['Abbeville', 'SC', 34.18, -82.38], ['Greenwood', 'SC', 34.19, -82.16], ['Laurens', 'SC', 34.50, -82.01],
  ['Gaffney', 'SC', 35.07, -81.65], ['Rock Hill', 'SC', 34.92, -81.03], ['Columbia', 'SC', 34.00, -81.03],
  ['Charleston', 'SC', 32.78, -79.93], ['Myrtle Beach', 'SC', 33.69, -78.89], ['Beaufort', 'SC', 32.43, -80.67],
  ['Hilton Head Island', 'SC', 32.22, -80.75], ['Aiken', 'SC', 33.56, -81.72], ['Florence', 'SC', 34.20, -79.76],
  // North Carolina
  ['Asheville', 'NC', 35.60, -82.55], ['Hendersonville', 'NC', 35.32, -82.46], ['Brevard', 'NC', 35.23, -82.73],
  ['Charlotte', 'NC', 35.23, -80.84], ['Raleigh', 'NC', 35.78, -78.64], ['Durham', 'NC', 35.99, -78.90],
  ['Chapel Hill', 'NC', 35.91, -79.06], ['Greensboro', 'NC', 36.07, -79.79], ['Winston-Salem', 'NC', 36.10, -80.24],
  ['Boone', 'NC', 36.22, -81.67], ['Wilmington', 'NC', 34.23, -77.94], ['Asheboro', 'NC', 35.71, -79.81],
  // Georgia
  ['Atlanta', 'GA', 33.75, -84.39], ['Athens', 'GA', 33.95, -83.36], ['Savannah', 'GA', 32.08, -81.09],
  ['Augusta', 'GA', 33.47, -81.97], ['Macon', 'GA', 32.84, -83.63], ['Toccoa', 'GA', 34.58, -83.33],
  ['Helen', 'GA', 34.70, -83.73], ['Dahlonega', 'GA', 34.53, -83.98], ['Decatur', 'GA', 33.77, -84.30],
  // Tennessee and the Southeast
  ['Nashville', 'TN', 36.16, -86.78], ['Knoxville', 'TN', 35.96, -83.92], ['Chattanooga', 'TN', 35.05, -85.31],
  ['Memphis', 'TN', 35.15, -90.05], ['Gatlinburg', 'TN', 35.71, -83.51], ['Birmingham', 'AL', 33.52, -86.80],
  ['Huntsville', 'AL', 34.73, -86.59], ['Montgomery', 'AL', 32.37, -86.30], ['Mobile', 'AL', 30.70, -88.04],
  ['Jacksonville', 'FL', 30.33, -81.66], ['Miami', 'FL', 25.76, -80.19], ['Orlando', 'FL', 28.54, -81.38],
  ['Tampa', 'FL', 27.95, -82.46], ['St. Petersburg', 'FL', 27.77, -82.64], ['Tallahassee', 'FL', 30.44, -84.28],
  ['Fort Lauderdale', 'FL', 26.12, -80.14], ['Key West', 'FL', 24.56, -81.78], ['Pensacola', 'FL', 30.42, -87.22],
  ['New Orleans', 'LA', 29.95, -90.07], ['Baton Rouge', 'LA', 30.45, -91.19], ['Jackson', 'MS', 32.30, -90.18],
  ['Louisville', 'KY', 38.25, -85.76], ['Lexington', 'KY', 38.04, -84.50], ['Frankfort', 'KY', 38.20, -84.87],
  ['Richmond', 'VA', 37.54, -77.44], ['Virginia Beach', 'VA', 36.85, -75.98], ['Norfolk', 'VA', 36.85, -76.29],
  ['Charlottesville', 'VA', 38.03, -78.48], ['Roanoke', 'VA', 37.27, -79.94], ['Charleston', 'WV', 38.35, -81.63],
  // Northeast and Mid-Atlantic
  ['New York', 'NY', 40.71, -74.01], ['Brooklyn', 'NY', 40.68, -73.94], ['Buffalo', 'NY', 42.89, -78.88],
  ['Albany', 'NY', 42.65, -73.76], ['Philadelphia', 'PA', 39.95, -75.17], ['Pittsburgh', 'PA', 40.44, -79.99],
  ['Harrisburg', 'PA', 40.27, -76.88], ['Boston', 'MA', 42.36, -71.06], ['Providence', 'RI', 41.82, -71.41],
  ['Hartford', 'CT', 41.77, -72.67], ['New Haven', 'CT', 41.31, -72.92], ['Newark', 'NJ', 40.74, -74.17],
  ['Jersey City', 'NJ', 40.73, -74.08], ['Trenton', 'NJ', 40.22, -74.76], ['Baltimore', 'MD', 39.29, -76.61],
  ['Annapolis', 'MD', 38.98, -76.49], ['Washington', 'DC', 38.91, -77.04], ['Wilmington', 'DE', 39.74, -75.55],
  ['Dover', 'DE', 39.16, -75.52], ['Portland', 'ME', 43.66, -70.26], ['Augusta', 'ME', 44.31, -69.78],
  ['Burlington', 'VT', 44.48, -73.21], ['Montpelier', 'VT', 44.26, -72.58], ['Concord', 'NH', 43.21, -71.54],
  ['Manchester', 'NH', 42.99, -71.46],
  // Midwest
  ['Chicago', 'IL', 41.88, -87.63], ['Springfield', 'IL', 39.78, -89.65], ['Detroit', 'MI', 42.33, -83.05],
  ['Ann Arbor', 'MI', 42.28, -83.74], ['Grand Rapids', 'MI', 42.96, -85.67], ['Lansing', 'MI', 42.73, -84.56],
  ['Columbus', 'OH', 39.96, -83.00], ['Cleveland', 'OH', 41.50, -81.69], ['Cincinnati', 'OH', 39.10, -84.51],
  ['Indianapolis', 'IN', 39.77, -86.16], ['Milwaukee', 'WI', 43.04, -87.91], ['Madison', 'WI', 43.07, -89.40],
  ['Minneapolis', 'MN', 44.98, -93.27], ['Saint Paul', 'MN', 44.95, -93.09], ['Des Moines', 'IA', 41.59, -93.62],
  ['St. Louis', 'MO', 38.63, -90.20], ['Kansas City', 'MO', 39.10, -94.58], ['Jefferson City', 'MO', 38.58, -92.17],
  ['Omaha', 'NE', 41.26, -95.93], ['Lincoln', 'NE', 40.81, -96.70], ['Topeka', 'KS', 39.05, -95.68],
  ['Wichita', 'KS', 37.69, -97.34], ['Fargo', 'ND', 46.88, -96.79], ['Bismarck', 'ND', 46.81, -100.78],
  ['Sioux Falls', 'SD', 43.54, -96.73], ['Pierre', 'SD', 44.37, -100.35],
  // South Central and Texas
  ['Houston', 'TX', 29.76, -95.37], ['Dallas', 'TX', 32.78, -96.80], ['Austin', 'TX', 30.27, -97.74],
  ['San Antonio', 'TX', 29.42, -98.49], ['Fort Worth', 'TX', 32.76, -97.33], ['El Paso', 'TX', 31.76, -106.49],
  ['Oklahoma City', 'OK', 35.47, -97.52], ['Tulsa', 'OK', 36.15, -95.99], ['Little Rock', 'AR', 34.75, -92.29],
  ['Fayetteville', 'AR', 36.06, -94.16],
  // Mountain West and Southwest
  ['Denver', 'CO', 39.74, -104.99], ['Boulder', 'CO', 40.01, -105.27], ['Colorado Springs', 'CO', 38.83, -104.82],
  ['Phoenix', 'AZ', 33.45, -112.07], ['Tucson', 'AZ', 32.22, -110.97], ['Scottsdale', 'AZ', 33.49, -111.93],
  ['Sedona', 'AZ', 34.87, -111.76], ['Albuquerque', 'NM', 35.08, -106.65], ['Santa Fe', 'NM', 35.69, -105.94],
  ['Las Vegas', 'NV', 36.17, -115.14], ['Reno', 'NV', 39.53, -119.81], ['Carson City', 'NV', 39.16, -119.77],
  ['Salt Lake City', 'UT', 40.76, -111.89], ['Park City', 'UT', 40.65, -111.50], ['Boise', 'ID', 43.62, -116.20],
  ['Cheyenne', 'WY', 41.14, -104.82], ['Jackson', 'WY', 43.48, -110.76], ['Helena', 'MT', 46.59, -112.04],
  ['Bozeman', 'MT', 45.68, -111.04], ['Missoula', 'MT', 46.87, -113.99],
  // West Coast, Alaska, Hawaii
  ['Los Angeles', 'CA', 34.05, -118.24], ['San Diego', 'CA', 32.72, -117.16], ['San Francisco', 'CA', 37.77, -122.42],
  ['San Jose', 'CA', 37.34, -121.89], ['Oakland', 'CA', 37.80, -122.27], ['Sacramento', 'CA', 38.58, -121.49],
  ['Palm Springs', 'CA', 33.83, -116.55], ['Santa Barbara', 'CA', 34.42, -119.70], ['Long Beach', 'CA', 33.77, -118.19],
  ['Seattle', 'WA', 47.61, -122.33], ['Spokane', 'WA', 47.66, -117.43], ['Olympia', 'WA', 47.04, -122.90],
  ['Portland', 'OR', 45.52, -122.68], ['Eugene', 'OR', 44.05, -123.09], ['Salem', 'OR', 44.94, -123.04],
  ['Bend', 'OR', 44.06, -121.31], ['Anchorage', 'AK', 61.22, -149.90], ['Juneau', 'AK', 58.30, -134.42],
  ['Honolulu', 'HI', 21.31, -157.86],
]
