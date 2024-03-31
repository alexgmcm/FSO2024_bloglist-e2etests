const { test, expect, beforeEach, describe , apiRequest} = require('@playwright/test')

describe('Blog List app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http:localhost:3001/api/testing/reset')
    const response = await request.post('http://localhost:3001/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    }
    )
   

    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {
    await expect(page.getByTestId('login-form')).toBeDefined()
  })

  test('login works with correct password', async ({ page }) =>{
    await page.getByTestId('username').fill('mluukkai')
    await page.getByTestId('password').fill('salainen')
    await page.getByRole('button', { name: 'login' }).click()
  
    await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
  })

  test('login fails with wrong password', async ({ page }) =>{
    await page.getByTestId('username').fill('mluukkai')
    await page.getByTestId('password').fill('wrong')
    await page.getByRole('button', { name: 'login' }).click()
  
    const errorDiv = await page.locator('.error')
    await expect(errorDiv).toContainText('Wrong credentials')
    await expect(errorDiv).toHaveCSS('border-style', 'solid')
    await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')
  
  
    await expect(page.getByText('Matti Luukkainen logged in')).not.toBeVisible()
  })

})

describe('When logged in', () => {
    beforeEach(async ({ page, request }) => {
        await request.post('http:localhost:3001/api/testing/reset')
        await request.post('http://localhost:3001/api/users', {
          data: {
            name: 'Matti Luukkainen',
            username: 'mluukkai',
            password: 'salainen'
          }
        })

        await request.post('http://localhost:3001/api/users', {
      data: {
        name: 'Test User',
        username: 'test',
        password: 'hunter2'
      }
    })
    
        await page.goto('http://localhost:5173')
        await page.getByTestId('username').fill('mluukkai')
        await page.getByTestId('password').fill('salainen')
        await page.getByRole('button', { name: 'login' }).click()
    })
  
    test('a new blog can be created', async ({ page }) => {
        await page.getByRole('button', { name: 'new note' }).click()
        await page.getByTestId('title').fill('test title')
        await page.getByTestId('author').fill('test author')
        await page.getByTestId('url').fill('www.test.com')
        await page.getByRole('button', { name: 'create' }).click()
        await expect(page.getByText(' test title test author ')).toBeVisible()
    })

    test('likes increment', async ({ page }) => {
        await page.getByRole('button', { name: 'new note' }).click()
        await page.getByTestId('title').fill('test title')
        await page.getByTestId('author').fill('test author')
        await page.getByTestId('url').fill('www.test.com')
        await page.getByRole('button', { name: 'create' }).click()

        await page.getByRole('button', { name: 'view' }).click()
        await expect(page.getByText('likes 0')).toBeVisible()

        await page.getByRole('button', { name: 'like' }).click()

        await page.getByRole('button', { name: 'view' }).click()
        await expect(page.getByText('likes 1')).toBeVisible()
    })

    test('can delete', async ({ page }) => {
        await page.getByRole('button', { name: 'new note' }).click()
        await page.getByTestId('title').fill('test title')
        await page.getByTestId('author').fill('test author')
        await page.getByTestId('url').fill('www.test.com')
        await page.getByRole('button', { name: 'create' }).click()

        await page.getByRole('button', { name: 'view' }).click()
        await page.getByRole('button', { name: 'remove' }).click()
        
        await expect(page.getByText(' test title test author ')).not.toBeVisible()
    })

    test('other user cannot delete', async ({ page }) => {
        await page.getByRole('button', { name: 'new note' }).click()
        await page.getByTestId('title').fill('test title')
        await page.getByTestId('author').fill('test author')
        await page.getByTestId('url').fill('www.test.com')
        await page.getByRole('button', { name: 'create' }).click()

        await page.getByRole('button', { name: 'Logout' }).click()
        await page.getByTestId('username').fill('test')
        await page.getByTestId('password').fill('hunter2')
        await page.getByRole('button', { name: 'login' }).click()

        await page.getByRole('button', { name: 'view' }).click()
        await expect(page.getByRole('button', { name: 'remove' })).not.toBeVisible()

    })

  })

  describe('Many blogs exist', () => {
    beforeEach(async ({ page, request }) => {
        await request.post('http:localhost:3001/api/testing/reset')
        await request.post('http://localhost:3001/api/users', {
          data: {
            name: 'Matti Luukkainen',
            username: 'mluukkai',
            password: 'salainen'
          }
        })
   
        await page.goto('http://localhost:5173')
        await page.getByTestId('username').fill('mluukkai')
        await page.getByTestId('password').fill('salainen')
        const responsePromise = page.waitForResponse('**/api/login')
        await page.getByRole('button', { name: 'login' }).click()
        const response = await responsePromise
        const creds = await response.json()
        const token = creds.token

        await request.post('http://localhost:3001/api/blogs/ ', {
          data: {
            title: "First",
            author: "Testy McTestFace",
            url: "http://www.test.com",
         likes: 666
          },
          headers: { authorization: `Bearer ${token}`}
        })

        await request.post('http://localhost:3001/api/blogs/ ', {
          data: {
            title: "Second",
            author: "Testy McTestFace",
            url: "http://www.test.com",
         likes: 333
          },
          headers: { authorization: `Bearer ${token}`}
        })

        await request.post('http://localhost:3001/api/blogs/ ', {
          data: {
            title: "Third",
            author: "Testy McTestFace",
            url: "http://www.test.com",
         likes: 111
          },
          headers: { authorization: `Bearer ${token}`}
        })

        await page.goto('http://localhost:5173')


    })

    test('blogs in order', async ({ page }) => {
    await expect(page.getByText('First Testy McTestFace')).toBeVisible()
    
    // Open all blogs so Likes are visible
    const viewButtons = page.getByRole('button',{ name: 'view' })
    let N = await viewButtons.count()
    for (let i=0; i<N; i++){
        // they get removed from list as you go, so just put 0
        await viewButtons.nth(0).click()
    }

    // get likes
    const likeTexts = await page.getByText('likes',{ exact: false }).allTextContents()
    const likes = likeTexts.map((x) => parseInt(x.match(/([0-9]+)/)[1]))

    //check order
    const isInDescendingOrder = likes.every((curVal,curInd, arr) => curVal<=arr[Math.max(0,curInd-1)])
    expect(isInDescendingOrder).toBeTruthy()
    



    })

  })