// Bundled postal-code reference used as an offline fallback for the live
// pincode lookup (so the checkout auto-fill keeps working even when the
// external API is down). Unknown codes fall back to deterministic demo data.

const INDIA = {
  '641001': { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore', area: 'Coimbatore H.O' },
  '641004': { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore', area: 'Gandhipuram' },
  '641011': { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore', area: 'Peelamedu' },
  '641018': { state: 'Tamil Nadu', district: 'Coimbatore', city: 'Coimbatore', area: 'RS Puram' },
  '600001': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', area: 'Chennai GPO' },
  '600028': { state: 'Tamil Nadu', district: 'Chennai', city: 'Chennai', area: 'T Nagar' },
  '110001': { state: 'Delhi', district: 'New Delhi', city: 'New Delhi', area: 'Connaught Place' },
  '110016': { state: 'Delhi', district: 'South Delhi', city: 'New Delhi', area: 'Hauz Khas' },
  '400001': { state: 'Maharashtra', district: 'Mumbai City', city: 'Mumbai', area: 'Mumbai GPO' },
  '400052': { state: 'Maharashtra', district: 'Mumbai Suburban', city: 'Mumbai', area: 'Andheri East' },
  '700001': { state: 'West Bengal', district: 'Kolkata', city: 'Kolkata', area: 'Kolkata GPO' },
  '560001': { state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru', area: 'Bangalore GPO' },
  '560034': { state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru', area: 'Koramangala' },
  '500001': { state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Hyderabad GPO' },
  '380001': { state: 'Gujarat', district: 'Ahmedabad', city: 'Ahmedabad', area: 'Ahmedabad GPO' },
  '411001': { state: 'Maharashtra', district: 'Pune', city: 'Pune', area: 'Pune City H.O' },
  '302001': { state: 'Rajasthan', district: 'Jaipur', city: 'Jaipur', area: 'Jaipur GPO' },
  '682001': { state: 'Kerala', district: 'Ernakulam', city: 'Kochi', area: 'Ernakulam H.O' },
  '695001': { state: 'Kerala', district: 'Thiruvananthapuram', city: 'Thiruvananthapuram', area: 'Trivandrum GPO' },
  '201301': { state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar', city: 'Noida', area: 'Sector 16 Noida' },
  '122001': { state: 'Haryana', district: 'Gurugram', city: 'Gurugram', area: 'Gurgaon H.O' },
  '160001': { state: 'Chandigarh', district: 'Chandigarh', city: 'Chandigarh', area: 'Chandigarh GPO' },
  '800001': { state: 'Bihar', district: 'Patna', city: 'Patna', area: 'Patna GPO' },
  '226001': { state: 'Uttar Pradesh', district: 'Lucknow', city: 'Lucknow', area: 'Lucknow GPO' },
  '462001': { state: 'Madhya Pradesh', district: 'Bhopal', city: 'Bhopal', area: 'Bhopal GPO' },
  '440001': { state: 'Maharashtra', district: 'Nagpur', city: 'Nagpur', area: 'Nagpur GPO' },
  '834001': { state: 'Jharkhand', district: 'Ranchi', city: 'Ranchi', area: 'Ranchi GPO' },
  '751001': { state: 'Odisha', district: 'Khordha', city: 'Bhubaneswar', area: 'Bhubaneswar GPO' },
  '781001': { state: 'Assam', district: 'Kamrup Metropolitan', city: 'Guwahati', area: 'Guwahati GPO' },
  '670001': { state: 'Kerala', district: 'Kozhikode', city: 'Kozhikode', area: 'Calicut H.O' },
  '682017': { state: 'Kerala', district: 'Ernakulam', city: 'Kochi', area: 'Kakkanad' },
  '500081': { state: 'Telangana', district: 'Hyderabad', city: 'Hyderabad', area: 'Madhapur' },
  '560103': { state: 'Karnataka', district: 'Bengaluru Urban', city: 'Bengaluru', area: 'Whitefield' },
  '421302': { state: 'Maharashtra', district: 'Thane', city: 'Kalyan', area: 'Dombivli' },
};

const USA = {
  '10001': { state: 'New York', district: 'New York County', city: 'New York', area: 'Manhattan' },
  '94103': { state: 'California', district: 'San Francisco County', city: 'San Francisco', area: 'SoMa' },
  '90210': { state: 'California', district: 'Los Angeles County', city: 'Beverly Hills', area: 'Beverly Hills' },
  '60601': { state: 'Illinois', district: 'Cook County', city: 'Chicago', area: 'The Loop' },
  '98101': { state: 'Washington', district: 'King County', city: 'Seattle', area: 'Downtown' },
  '33101': { state: 'Florida', district: 'Miami-Dade County', city: 'Miami', area: 'Downtown Miami' },
  '75201': { state: 'Texas', district: 'Dallas County', city: 'Dallas', area: 'Downtown' },
  '20001': { state: 'Washington, D.C.', district: 'District of Columbia', city: 'Washington', area: 'Downtown' },
  '02108': { state: 'Massachusetts', district: 'Suffolk County', city: 'Boston', area: 'Beacon Hill' },
  '85001': { state: 'Arizona', district: 'Maricopa County', city: 'Phoenix', area: 'Central City' },
  '19103': { state: 'Pennsylvania', district: 'Philadelphia County', city: 'Philadelphia', area: 'Center City' },
  '30301': { state: 'Georgia', district: 'Fulton County', city: 'Atlanta', area: 'Downtown' },
  '48201': { state: 'Michigan', district: 'Wayne County', city: 'Detroit', area: 'Downtown' },
  '78701': { state: 'Texas', district: 'Travis County', city: 'Austin', area: 'Downtown' },
  '97201': { state: 'Oregon', district: 'Multnomah County', city: 'Portland', area: 'Downtown' },
  '96813': { state: 'Hawaii', district: 'Honolulu County', city: 'Honolulu', area: 'Downtown' },
  '55401': { state: 'Minnesota', district: 'Hennepin County', city: 'Minneapolis', area: 'Downtown' },
  '80202': { state: 'Colorado', district: 'Denver County', city: 'Denver', area: 'Downtown' },
  '63101': { state: 'Missouri', district: 'St. Louis County', city: 'St. Louis', area: 'Downtown' },
  '19019': { state: 'Pennsylvania', district: 'Philadelphia County', city: 'Philadelphia', area: 'Center City' },
};

const INDIAN_STATES = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Maharashtra', 'Delhi', 'Uttar Pradesh', 'Gujarat', 'West Bengal', 'Rajasthan', 'Haryana', 'Telangana', 'Andhra Pradesh', 'Madhya Pradesh', 'Punjab', 'Bihar', 'Odisha', 'Chhattisgarh', 'Assam'];
const INDIAN_DISTRICTS = ['Coimbatore', 'Chennai', 'Ernakulam', 'Bengaluru Urban', 'Mumbai City', 'New Delhi', 'Pune', 'Ahmedabad', 'Kolkata', 'Hyderabad', 'Jaipur', 'Gurugram'];
const US_STATES = ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Washington', 'Massachusetts', 'Georgia', 'Pennsylvania', 'Colorado', 'Arizona'];
const US_CITIES = ['San Francisco', 'New York', 'Austin', 'Miami', 'Chicago', 'Seattle', 'Boston', 'Atlanta', 'Philadelphia', 'Denver'];
const LOCALITY_POOL = ['Main Street', 'Lake View', 'Green Park', 'Station Road', 'Central Market', 'Gandhi Nagar', 'Nehru Nagar', 'Indira Colony', 'Silver Oak Enclave', 'Blue Bells Layout'];

const hashStr = (s) => {
  let h = 0;
  const str = String(s || '');
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
};

const lookupIndia = (code) => INDIA[code] || null;
const lookupUSA = (code) => USA[code] || null;

// Deterministic demo result so the flow never dead-ends on an unknown code.
const generateIndia = (code) => {
  const h = hashStr('in:' + code);
  return {
    state: INDIAN_STATES[h % INDIAN_STATES.length],
    district: INDIAN_DISTRICTS[(h >> 3) % INDIAN_DISTRICTS.length],
    city: INDIAN_DISTRICTS[(h >> 3) % INDIAN_DISTRICTS.length],
    area: LOCALITY_POOL[h % LOCALITY_POOL.length] + ', ' + code,
    generated: true,
  };
};

const generateUSA = (code) => {
  const h = hashStr('us:' + code);
  return {
    state: US_STATES[h % US_STATES.length],
    district: US_STATES[(h >> 3) % US_STATES.length],
    city: US_CITIES[h % US_CITIES.length],
    area: LOCALITY_POOL[(h >> 4) % LOCALITY_POOL.length] + ', ' + code,
    generated: true,
  };
};

module.exports = {
  lookupIndia,
  lookupUSA,
  generateIndia,
  generateUSA,
};
