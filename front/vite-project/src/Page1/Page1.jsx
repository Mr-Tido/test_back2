import { useState,useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import "../Page1/Page1.scss"
export default function Page1({ onLogin, onLogout }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [message,setMessage] = useState('')
  const [data, setData] = useState([])
  const [oldPrice,setOldPrice] = useState('')
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userAge, setUserAge] = useState('')
  const [isError, setIsError] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedProizv, setSelectedProizv] = useState([])
    const [appliedProizv, setAppliedProizv] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 1000000]);
    const [appliedPrice, setAppliedPrice] = useState([0, 1000000]);
    const MAX_PRICE = 1000000;

    useEffect(() => {
        const interceptorId = axios.interceptors.request.use((config) => {
            const currentToken = localStorage.getItem('token');
            if (currentToken) {
                config.headers.Authorization = `Bearer ${currentToken}`;
            }
            return config;
        });

        return () => {
            axios.interceptors.request.eject(interceptorId);
        };
    }, []);

     const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        setIsError(false);

        try {
            const response = await axios.post('http://localhost:3000/api/auth/login', {
                name_user: loginUsername,
                password: loginPassword,
            });

            const newToken = response.data.token;
            onLogin?.(newToken);
            setUser(response.data.user);
            localStorage.setItem('token', newToken);

            setMessage('✅ Вход успешен!');

            setLoginUsername('');
            setLoginPassword('');
            navigate('/Page2')

        } catch (error) {
            setMessage(error.response?.data?.error || 'Ошибка входа');
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

     const handleLogout = () => {
        setUser(null);
        setData([]);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setMessage('Выход выполнен');
        onLogout?.();
    };

// useEffect(() => {
//   fetch('http://localhost:3000/api/main')
//   .then(res => res.json())
//   .then(data => setData(data))
// }, [])


    const onDelete = async (itemId) => {
        try {
            await axios.delete(`http://localhost:3000/api/delete/${itemId}`);
            setData(prev => prev.filter(item => item.id !== Number(itemId)));
        } catch (error) {
            console.error('❌ Ошибка:', error.response?.status, error.response?.data);
        }
};
const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/create', {
        title: String(title),
        price: Number(price),
        old_price: Number(oldPrice)
      });
      setMessage('Данные добавлены!');
      setTitle('');
      setPrice('');
      setOldPrice('');
    } catch (error) {
      setMessage('Ошибка: ' + error.response?.data?.error);
    }
};
   const handleSubmits = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/auth/register', {
        name_user:username,
        password:password,
        age_user:userAge,
      });

      setMessage(response.data.message || 'Регистрация успешна');
      setIsError(false);
      setUsername('');
      setPassword('');
      setUserAge('');

    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Ошибка регистрации';
      setMessage(errorMsg);
      setIsError(true);
    } finally {
      setLoading(false);
    }

  };

    const [proizv, setProizv] = useState({
        Volvo: false,
        Audi: false,
        BMW: false,
    });

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setProizv(prev => ({ ...prev, [name]: checked }));
    };



    useEffect(() => {
        const selected = Object.keys(proizv).filter(key => proizv[key]);

        const params = new URLSearchParams();
        params.append('queryName', 'proizv_filter');
        if (selected.length > 0) {
            params.append('proizv', selected.join(','));
        }

        axios.get(`http://localhost:3000/api/item?${params.toString()}`)
            .then(res => setData(res.data))
            .catch(console.error);
    }, [proizv]);



    const handleSelectChange = (e) => {
        const values = Array.from(e.target.selectedOptions, opt => opt.value);
        if (values.includes('all')) {
            setSelectedProizv(['all']);  // визуально выделяем "Все"
        } else {
            setSelectedProizv(values);
        }
    };

    const handleApply = () => {
        const filtered = selectedProizv.filter(v => v !== 'all');
        setAppliedProizv(filtered);  // если выбрано "Все" — передаём пустой массив
        setAppliedPrice(priceRange);
    };
    useEffect(() => {
        const params = new URLSearchParams();
        if (appliedProizv.length > 0) {
            params.append('proizv', appliedProizv.join(','));
        }
        params.append('minPrice', appliedPrice[0]);
        params.append('maxPrice', appliedPrice[1]);

        axios.get(`http://localhost:3000/api/item?${params.toString()}`)
            .then(res => setData(res.data))
            .catch(console.error);
    }, [appliedProizv, appliedPrice]);


    return (
    <>

    <div className="App">
      <div className="form-container">
        <h2>Регистрация</h2>
        <form onSubmit={handleSubmits}>
          <input
            type="text"
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input type="text"
            placeholder='Age'
            value={userAge}
            onChange={(e)=> setUserAge(e.target.value)}
            required
          />
          <button type="submit" >Зарегистрироваться</button>
        </form>
        {message && (
          <div className={isError ? 'error' : 'success'}>
            {message}
          </div>
        )}
      </div>
    </div>



    <form onSubmit={handleSubmit}>
      <input type="text" placeholder="Название" value={title}
      onChange={(e) => setTitle(e.target.value)} required/>

      <input type="number" placeholder="Цена" value={price}
      onChange={(e) => setPrice(e.target.value)} required/>

      <input type="number" placeholder='Старая цена' value={oldPrice}
      onChange={(e) => setOldPrice(e.target.value)} required />

      <button type="submit">Добавить</button>
      {message && <p>{message}</p>}
    </form>
       <div>

        </div>


        <div className="auth-container">
            <div className="form-container">
                <h3>Вход</h3>
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Логин"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading}>Войти</button>
                </form>
            </div>
        </div>

        <label>
            <input type="checkbox" name="Volvo" checked={proizv.Volvo} onChange={handleCheckboxChange} />
            Volvo
        </label>

        <label>
            <input type="checkbox" name="Audi" checked={proizv.Audi} onChange={handleCheckboxChange} />
            Audi
        </label>

        <label>
            <input type="checkbox" name="BMW" checked={proizv.BMW} onChange={handleCheckboxChange} />
            BMW
        </label>

        <select value={selectedProizv} onChange={handleSelectChange}>
            <option value="All">All</option>
            <option value="Volvo">Volvo</option>
            <option value="Audi">Audi</option>
            <option value="BMW">BMW</option>
        </select>
        <button onClick={handleApply}>Применить фильтр</button>

        <div style={{ position: 'relative', height: '40px', width: '300px' }}>
            <input
                type="range"
                min={0}
                max={MAX_PRICE}
                value={priceRange[0]}
                onChange={(e) => {
                    const val = Math.min(Number(e.target.value), priceRange[1] - 1);
                    setPriceRange([val, priceRange[1]]);
                }}
                style={{ position: 'absolute', width: '100%', pointerEvents: 'none', appearance: 'none', background: 'transparent' }}
            />
            <input
                type="range"
                min={0}
                max={MAX_PRICE}
                value={priceRange[1]}
                onChange={(e) => {
                    const val = Math.max(Number(e.target.value), priceRange[0] + 1);
                    setPriceRange([priceRange[0], val]);
                }}
                style={{ position: 'absolute', width: '100%', pointerEvents: 'none', appearance: 'none', background: 'transparent' }}
            />
        </div>
        <p>от {priceRange[0]} до {priceRange[1]} ₽</p>



        <ul>
            {data.map(item => (
                <li key={item.id}>
                    {item.name} — {item.proizv}
                </li>
            ))}
        </ul>


    </>
  )
}

